import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('serviceType')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"))
    const skip = Math.max(0, (page - 1) * limit)

    console.log("Fetching partners with:", { serviceType, search, page, limit, skip })

    // Construire les conditions de filtrage
    const whereConditions: any = {}
    
    if (serviceType && serviceType !== 'all') {
      whereConditions.serviceType = serviceType
    }
    
    if (search) {
      whereConditions.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { billingCity: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
          companyName: "asc",
        },
        select: {
          id: true,
          companyName: true,
          description: true,
          serviceType: true,
          billingCity: true,
          billingCountry: true,
          images: true,
          basePrice: true,
          priceRange: true,
          maxCapacity: true,
          minCapacity: true,
          createdAt: true,
          updatedAt: true,
          storefronts: {
            select: {
              id: true,
              isActive: true
            },
            take: 1
          }
        },
      }),
      prisma.partner.count({ where: whereConditions }),
    ])

    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedPartners = partners.map((partner) => {
      return {
        id: partner.id,
        name: partner.companyName,
        type: partner.serviceType,
        description: partner.description,
        location: `${partner.billingCity}, ${partner.billingCountry}`,
        images: partner.images || [],
        basePrice: partner.basePrice,
        priceRange: partner.priceRange,
        maxCapacity: partner.maxCapacity,
        minCapacity: partner.minCapacity,
        isActive: partner.storefronts[0]?.isActive || false,
        storefrontId: partner.storefronts[0]?.id,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt
      }
    })

    console.log("Found partners:", transformedPartners.length)

    return NextResponse.json({
      partners: transformedPartners,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error("Error fetching partners:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des partenaires" },
      { status: 500 }
    )
  }
}

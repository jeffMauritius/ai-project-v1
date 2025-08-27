import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Récupérer tous les storefronts avec leurs informations
    const storefronts = await prisma.partnerStorefront.findMany({
      include: {
        establishment: {
          select: {
            id: true,
            name: true,
            city: true,
            region: true,
            description: true,
            rating: true,
            reviewCount: true,
          }
        },
        partner: {
          select: {
            id: true,
            companyName: true,
            description: true,
            serviceType: true,
            billingCity: true,
          }
        }
      }
    })

    // Formater les données pour l'affichage
    const formattedStorefronts = storefronts.map(storefront => ({
      id: storefront.id,
      type: storefront.type,
      isActive: storefront.isActive,
      establishment: storefront.establishment ? {
        id: storefront.establishment.id,
        name: storefront.establishment.name,
        location: `${storefront.establishment.city}, ${storefront.establishment.region}`,
        description: storefront.establishment.description,
        rating: storefront.establishment.rating,
        reviewCount: storefront.establishment.reviewCount,
      } : null,
      partner: storefront.partner ? {
        id: storefront.partner.id,
        companyName: storefront.partner.companyName,
        description: storefront.partner.description,
        serviceType: storefront.partner.serviceType,
        location: storefront.partner.billingCity,
      } : null,
    }))

    return NextResponse.json({
      total: storefronts.length,
      storefronts: formattedStorefronts
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des storefronts:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
// import { transformImageUrlWithEntity } from '@/lib/image-url-transformer' // Non utilisé pour le moment

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const serviceType = searchParams.get('serviceType')

    // Construire le filtre where
    const whereClause: any = {}

    // Ajouter le filtre par type de service si spécifié
    if (serviceType) {
      whereClause.serviceType = {
        equals: serviceType
      }
    } else {
      // Si aucun filtre spécifique, exclure seulement les lieux
      whereClause.serviceType = {
        not: 'LIEU'
      }
    }

    // Récupérer les prestataires avec leurs images directement de la collection partners
    const partners = await prisma.partner.findMany({
      where: whereClause,
      select: {
        id: true,
        companyName: true,
        description: true,
        // shortDescription: true, // Champ peut ne pas exister dans la DB
        serviceType: true,
        billingCity: true,
        billingCountry: true,
        basePrice: true,
        maxCapacity: true,
        images: true,
        storefronts: {
          select: {
            id: true,
            isActive: true
          },
          take: 1
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      // Ordre de tri pour avoir une diversité de types sur chaque page
      orderBy: {
        companyName: 'asc'   // Trier par nom de compagnie pour avoir une diversité naturelle
      }
    })

    const total = await prisma.partner.count({
      where: whereClause
    })

    // Transformer les données
    const prestataires = partners.map(partner => {
      const storefront = partner.storefronts?.[0]
      const images = partner.images || []
      
      return {
        id: storefront?.id || partner.id,
        name: partner.companyName,
        companyName: partner.companyName,
        description: partner.description || '',
        serviceType: partner.serviceType,
        location: `${partner.billingCity || ''}, ${partner.billingCountry || ''}`,
        rating: 4.5,
        price: partner.basePrice || undefined,
        capacity: partner.maxCapacity || undefined,
        images: images,
        imageUrl: images.length > 0 ? images[0] : undefined,
        logo: null,
        isActive: storefront?.isActive || false
      }
    })

    return NextResponse.json({
      prestataires,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('❌ Erreur API prestataires:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: 'Erreur lors du chargement des prestataires', details: errorMessage },
      { status: 500 }
    )
  }
}
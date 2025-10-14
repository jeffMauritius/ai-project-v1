import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, ServiceType } from '@prisma/client'
import { transformImageUrlWithEntity } from '@/lib/image-url-transformer'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const serviceType = searchParams.get('serviceType')

    console.log('🔍 Requête prestataires:', { page, limit, serviceType })

    // Construire le filtre where
    const whereClause: any = {
      serviceType: {
        not: 'LIEU' // Exclure les lieux qui sont gérés dans Establishment
      }
    }

    // Ajouter le filtre par type de service si spécifié
    if (serviceType) {
      whereClause.serviceType = {
        equals: serviceType
      }
    }

    // Récupérer les prestataires avec leurs images directement de la collection partners
    const partners = await prisma.partner.findMany({
      where: whereClause,
      select: {
        id: true,
        companyName: true,
        description: true,
        serviceType: true,
        billingCity: true,
        billingCountry: true,
        basePrice: true,
        maxCapacity: true,
        images: true, // Utiliser les images directement de la collection partners
        storefronts: {
          select: {
            id: true,
            isActive: true
          },
          take: 1
        }
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.partner.count({
      where: whereClause
    })

    console.log(`👨‍💼 ${partners.length} prestataires trouvés sur ${total} total`)

    // Transformer les données
    const prestataires = partners.map(partner => {
      const storefront = partner.storefronts?.[0]
      const images = partner.images || [] // Utiliser les images directement de la collection partners
      
      return {
        id: storefront?.id || partner.id, // Utiliser l'ID du storefront si disponible
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
    return NextResponse.json(
      { error: 'Erreur lors du chargement des prestataires', details: error.message },
      { status: 500 }
    )
  }
}

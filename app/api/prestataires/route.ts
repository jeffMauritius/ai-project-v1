import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, ServiceType } from '@prisma/client'
import { transformImageUrlWithEntity } from '@/lib/image-url-transformer'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('🔍 Requête prestataires:', { page, limit })

    // Récupérer les prestataires avec leurs images et storefronts
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        description: true,
        serviceType: true,
        billingCity: true,
        billingCountry: true,
        basePrice: true,
        maxCapacity: true,
        storefronts: {
          select: {
            id: true,
            isActive: true,
            images: true
          },
          take: 1
        }
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.partner.count()

    console.log(`👨‍💼 ${partners.length} prestataires trouvés sur ${total} total`)

    // Transformer les données
    const prestataires = partners.map(partner => {
      const storefront = partner.storefronts?.[0]
      const images = storefront?.images || []
      
      // Transformer les URLs d'images
      const transformedImages = images.map((url, index) => 
        transformImageUrlWithEntity(url, storefront?.id || partner.id, 'partners', index + 1)
      )
      
      return {
        id: storefront?.id || partner.id, // Utiliser l'ID du storefront si disponible
        name: partner.companyName,
        companyName: partner.companyName,
        description: partner.description || '',
        serviceType: partner.serviceType,
        location: `${partner.billingCity || ''}, ${partner.billingCountry || ''}`,
        rating: 4.5,
        price: partner.basePrice || 0,
        capacity: partner.maxCapacity || undefined,
        images: transformedImages,
        imageUrl: transformedImages.length > 0 ? transformedImages[0] : undefined,
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

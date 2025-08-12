import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    // Récupérer l'utilisateur avec ses partenaires
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        partners: {
          include: {
            storefronts: {
              include: {
                media: true,
                establishment: {
                  include: {
                    receptionSpaces: true,
                    receptionOptions: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    if (user.role !== "PARTNER") {
      return new NextResponse("Accès non autorisé", { status: 403 })
    }

    // Récupérer le premier partenaire de l'utilisateur
    const partner = user.partners[0]
    if (!partner) {
      return new NextResponse("Partenaire non trouvé", { status: 404 })
    }

    // Récupérer la vitrine du partenaire
    const storefront = partner.storefronts[0]
    if (!storefront) {
      return new NextResponse("Vitrine non trouvée", { status: 404 })
    }

    // Préparer les données de réponse
    let responseData: any = {
      id: storefront.id,
      createdAt: storefront.createdAt,
      updatedAt: storefront.updatedAt,
      type: storefront.type,
      isActive: storefront.isActive,
      logo: storefront.logo,
      media: storefront.media,
      partnerId: storefront.partnerId,
      establishmentId: storefront.establishmentId
    }

    // Si c'est un lieu (VENUE), inclure les données de l'établissement
    if (storefront.type === 'VENUE' && storefront.establishment) {
      responseData.establishment = {
        id: storefront.establishment.id,
        name: storefront.establishment.name,
        description: storefront.establishment.description,
        type: storefront.establishment.type,
        address: storefront.establishment.address,
        city: storefront.establishment.city,
        region: storefront.establishment.region,
        country: storefront.establishment.country,
        postalCode: storefront.establishment.postalCode,
        latitude: storefront.establishment.latitude,
        longitude: storefront.establishment.longitude,
        maxCapacity: storefront.establishment.maxCapacity,
        minCapacity: storefront.establishment.minCapacity,
        surface: storefront.establishment.surface,
        startingPrice: storefront.establishment.startingPrice,
        currency: storefront.establishment.currency,
        rating: storefront.establishment.rating,
        reviewCount: storefront.establishment.reviewCount,
        imageUrl: storefront.establishment.imageUrl,
        images: storefront.establishment.images,
        venueType: storefront.establishment.venueType,
        hasParking: storefront.establishment.hasParking,
        hasGarden: storefront.establishment.hasGarden,
        hasTerrace: storefront.establishment.hasTerrace,
        hasKitchen: storefront.establishment.hasKitchen,
        hasAccommodation: storefront.establishment.hasAccommodation,
        receptionSpaces: storefront.establishment.receptionSpaces,
        receptionOptions: storefront.establishment.receptionOptions
      }
    }

    // Si c'est un partenaire (PARTNER), inclure les données du partenaire
    if (storefront.type === 'PARTNER' && storefront.partnerId) {
      responseData.partner = {
        id: partner.id,
        companyName: partner.companyName,
        description: partner.description,
        serviceType: partner.serviceType,
        billingStreet: partner.billingStreet,
        billingCity: partner.billingCity,
        billingPostalCode: partner.billingPostalCode,
        billingCountry: partner.billingCountry,
        siret: partner.siret,
        vatNumber: partner.vatNumber,
        interventionType: partner.interventionType,
        interventionRadius: partner.interventionRadius,
        interventionCities: partner.interventionCities,
        basePrice: partner.basePrice,
        priceRange: partner.priceRange,
        services: partner.services,
        maxCapacity: partner.maxCapacity,
        minCapacity: partner.minCapacity,
        options: partner.options,
        searchableOptions: partner.searchableOptions
      }
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("[USER_PARTNER_DATA_GET] Erreur:", error)
    return new NextResponse(`Erreur interne: ${error.message}`, { status: 500 })
  }
} 
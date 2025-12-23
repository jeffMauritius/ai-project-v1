import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ServiceType, VenueType, StorefrontType } from "@prisma/client"
import { transformPartnerImages } from "@/lib/image-url-transformer"

const storefrontSchema = z.object({
  // Champs du storefront
  type: z.nativeEnum(StorefrontType).optional(),
  isActive: z.boolean().optional(),
  logo: z.string().nullable().optional(),

  // Champs du partenaire
  companyName: z.string().optional(),
  description: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  billingStreet: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  siret: z.string().optional(),
  vatNumber: z.string().optional(),
  interventionType: z.string().optional(),
  interventionRadius: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // Champs de l'établissement (pour les lieux)
  venueType: z.nativeEnum(VenueType).optional(),

  // Champs optionnels
  establishmentId: z.string().optional(),
  partnerId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Si un ID est fourni, accès public à la vitrine
    if (id) {
      const storefront = await prisma.partnerStorefront.findUnique({
        where: { id },
        include: {
          media: true,
          establishment: {
            include: {
              receptionSpaces: true,
              receptionOptions: true,
            }
          },
          partner: {
            include: {
              // Inclure toutes les données du partenaire
            }
          },
        },
      })
      if (!storefront) {
        return new NextResponse('Storefront non trouvé', { status: 404 })
      }
      return NextResponse.json(storefront)
    }

    // Sinon, accès privé par session (partenaire connecté)
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    // Trouver le partenaire de l'utilisateur connecté
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partners: true }
    })

    if (!user || user.role !== "PARTNER") {
      return new NextResponse("Accès non autorisé", { status: 403 })
    }

    const partner = user.partners[0]

    // Chercher d'abord le storefront du partenaire
    let storefront = null
    let establishment = null

    if (partner) {
      storefront = await prisma.partnerStorefront.findFirst({
        where: { partnerId: partner.id },
        include: {
          media: true,
          establishment: {
            include: {
              receptionSpaces: true,
              receptionOptions: true
            }
          }
        }
      })

      // Si le storefront a un establishment, le récupérer
      if (storefront?.establishment) {
        establishment = storefront.establishment
      }
    }

    // Si pas de storefront via partenaire, chercher via établissement
    if (!storefront) {
      // Chercher un storefront lié à un établissement pour cet utilisateur
      // Note: Les établissements n'ont pas de userId direct, donc on cherche via le storefront
      storefront = await prisma.partnerStorefront.findFirst({
        where: {
          establishmentId: { not: null }
        },
        include: {
          media: true,
          establishment: {
            include: {
              receptionSpaces: true,
              receptionOptions: true
            }
          }
        }
      })

      if (storefront?.establishment) {
        establishment = storefront.establishment
      }
    }

    if (!storefront) {
      return new NextResponse("Vitrine non trouvée", { status: 404 })
    }

    // Retourner une structure simplifiée et cohérente
    let responseData: any

    if (partner) {
      // Structure pour les partenaires (avec ou sans establishment)
      responseData = {
        id: storefront.id,
        type: storefront.type,
        isActive: storefront.isActive,
        logo: storefront.logo,
        media: storefront.media,
        // Données du partenaire fusionnées
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
        latitude: partner.latitude,
        longitude: partner.longitude,
        options: partner.options,
        searchableOptions: partner.searchableOptions,
        // Métadonnées
        createdAt: storefront.createdAt,
        updatedAt: storefront.updatedAt,
        // Ajouter establishmentId si présent (pour les lieux de réception)
        establishmentId: storefront.establishmentId || null,
      }

      // Si le partenaire a un establishment (type LIEU), ajouter les données spécifiques
      if (establishment) {
        responseData.receptionSpaces = establishment.receptionSpaces || []
        responseData.receptionOptions = establishment.receptionOptions || {}
        responseData.venueType = establishment.venueType || null
      }
    } else if (establishment) {
      // Structure pour les établissements sans partenaire
      responseData = {
        id: storefront.id,
        type: storefront.type,
        isActive: storefront.isActive,
        logo: storefront.logo,
        media: storefront.media,
        // Données de l'établissement fusionnées
        companyName: establishment.name,
        description: establishment.description,
        serviceType: 'LIEU',
        venueType: establishment.venueType || null,
        // Adresse
        billingStreet: establishment.address,
        billingCity: establishment.city,
        billingPostalCode: establishment.postalCode,
        billingCountry: establishment.country,
        latitude: establishment.latitude,
        longitude: establishment.longitude,
        // Options de réception spécifiques aux établissements
        receptionSpaces: establishment.receptionSpaces || [],
        receptionOptions: establishment.receptionOptions || {},
        establishmentId: storefront.establishmentId,
        // Métadonnées
        createdAt: storefront.createdAt,
        updatedAt: storefront.updatedAt
      }
    }

    // Appliquer la transformation des URLs d'images
    return NextResponse.json(transformPartnerImages(responseData))
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_GET] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const validatedData = storefrontSchema.parse(body)
    
    // Vérifier si l'utilisateur existe et a le bon rôle
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partners: true }
    })

    if (!user) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    if (user.role !== "PARTNER") {
      return new NextResponse("Accès non autorisé", { status: 403 })
    }

    // Trouver le partenaire de l'utilisateur
    const partner = user.partners[0]
    if (!partner) {
      return new NextResponse("Partenaire non trouvé", { status: 404 })
    }

    // Vérifier si une vitrine existe déjà pour ce partenaire
    const existingStorefront = await prisma.partnerStorefront.findFirst({
      where: { partnerId: partner.id },
    })

    if (existingStorefront) {
      return new NextResponse("Une vitrine existe déjà pour ce partenaire", { status: 400 })
    }

    // Créer la nouvelle vitrine
    const storefront = await prisma.partnerStorefront.create({
      data: {
        ...validatedData,
        partnerId: partner.id,
      },
      include: {
        media: true,
        partner: true,
      },
    })

    return NextResponse.json(storefront)
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_POST] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()

    const validatedData = storefrontSchema.partial().parse(body)

    // Vérifier si l'utilisateur existe et a le bon rôle
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partners: true }
    })

    if (!user) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    if (user.role !== "PARTNER") {
      return new NextResponse("Accès non autorisé", { status: 403 })
    }

    // Trouver le partenaire de l'utilisateur
    const partner = user.partners[0]
    if (!partner) {
      console.log("[PARTNER_STOREFRONT_PUT] Aucun partenaire trouvé pour l'utilisateur")
      return new NextResponse("Partenaire non trouvé", { status: 404 })
    }

    // Trouver la vitrine existante
    const existingStorefront = await prisma.partnerStorefront.findFirst({
      where: { partnerId: partner.id },
    })

    if (!existingStorefront) {
      console.log("[PARTNER_STOREFRONT_PUT] Aucune vitrine trouvée")
      return new NextResponse("Vitrine non trouvée", { status: 404 })
    }

    // Vérifier si le serviceType a changé
    const serviceTypeChanged = validatedData.serviceType && validatedData.serviceType !== partner.serviceType;
    const newServiceType = validatedData.serviceType || partner.serviceType;
    
    // Mapping des types de service vers les types de prestataires
    const SERVICE_TO_PROVIDER_MAPPING: Record<string, string> = {
      LIEU: "reception-venue",
      TRAITEUR: "caterer",
      FAIRE_PART: "invitation",
      CADEAUX_INVITES: "guest-gifts",
      PHOTOGRAPHE: "photographer",
      MUSIQUE: "music-dj",
      VOITURE: "vehicle",
      BUS: "vehicle",
      DECORATION: "decoration",
      CHAPITEAU: "tent",
      ANIMATION: "animation",
      FLORISTE: "florist",
      LISTE: "wedding-registry",
      ORGANISATION: "wedding-planner",
      VIDEO: "video",
      LUNE_DE_MIEL: "honeymoon-travel",
      WEDDING_CAKE: "wedding-cake",
      OFFICIANT: "officiant",
      FOOD_TRUCK: "food-truck",
      VIN: "wine"
    };
    
    // Préparer les options mises à jour
    let updatedOptions = partner.options || {};
    
    if (serviceTypeChanged) {

      const providerType = SERVICE_TO_PROVIDER_MAPPING[newServiceType];
      if (providerType) {
        // Initialiser les options pour le nouveau type de service
        updatedOptions = {
          ...updatedOptions,
          [providerType]: {}
        };

      }
    }
    
    // Mettre à jour le partenaire avec les données de base
    const updatedPartner = await prisma.partner.update({
      where: { id: existingStorefront.partnerId! },
      data: {
        companyName: validatedData.companyName || partner.companyName,
        description: validatedData.description || partner.description,
        serviceType: newServiceType,
        billingStreet: validatedData.billingStreet || partner.billingStreet,
        billingCity: validatedData.billingCity || partner.billingCity,
        billingPostalCode: validatedData.billingPostalCode || partner.billingPostalCode,
        billingCountry: validatedData.billingCountry || partner.billingCountry,
        siret: validatedData.siret || partner.siret,
        vatNumber: validatedData.vatNumber || partner.vatNumber,
        interventionType: validatedData.interventionType || partner.interventionType,
        interventionRadius: validatedData.interventionRadius || partner.interventionRadius,
        latitude: validatedData.latitude || partner.latitude,
        longitude: validatedData.longitude || partner.longitude,
        options: updatedOptions,
      }
    })

    // Mettre à jour la vitrine
    const updatedStorefront = await prisma.partnerStorefront.update({
      where: { id: existingStorefront.id },
      data: {
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : existingStorefront.isActive,
        logo: validatedData.logo || existingStorefront.logo,
      },
      include: {
        media: true,
        partner: true,
        establishment: true,
      },
    })

    // Si c'est un lieu de réception et qu'on a un venueType, mettre à jour l'Establishment
    let updatedVenueType = updatedStorefront.establishment?.venueType
    if (validatedData.venueType && updatedStorefront.establishmentId) {
      const updatedEstablishment = await prisma.establishment.update({
        where: { id: updatedStorefront.establishmentId },
        data: { venueType: validatedData.venueType }
      })
      updatedVenueType = updatedEstablishment.venueType
    }

    // Retourner la même structure que GET
    const responseData = {
      id: updatedStorefront.id,
      type: updatedStorefront.type,
      isActive: updatedStorefront.isActive,
      logo: updatedStorefront.logo,
      media: updatedStorefront.media,
      // Données du partenaire fusionnées
      companyName: updatedPartner.companyName,
      description: updatedPartner.description,
      serviceType: updatedPartner.serviceType,
      billingStreet: updatedPartner.billingStreet,
      billingCity: updatedPartner.billingCity,
      billingPostalCode: updatedPartner.billingPostalCode,
      billingCountry: updatedPartner.billingCountry,
      siret: updatedPartner.siret,
      vatNumber: updatedPartner.vatNumber,
      interventionType: updatedPartner.interventionType,
      interventionRadius: updatedPartner.interventionRadius,
      latitude: updatedPartner.latitude,
      longitude: updatedPartner.longitude,
      options: updatedPartner.options,
      searchableOptions: updatedPartner.searchableOptions,
      // Données de l'établissement (pour les lieux)
      venueType: updatedVenueType || null,
      establishmentId: updatedStorefront.establishmentId || null,
      // Métadonnées
      createdAt: updatedStorefront.createdAt,
      updatedAt: updatedStorefront.updatedAt
    }
    
    // Appliquer la transformation des URLs d'images
    return NextResponse.json(transformPartnerImages(responseData))
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_PUT] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 
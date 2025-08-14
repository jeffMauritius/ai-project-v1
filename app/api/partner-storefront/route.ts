import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ServiceType, VenueType, StorefrontType } from "@prisma/client"

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
    console.log("[PARTNER_STOREFRONT_GET] Session:", session)
    if (!session?.user?.id) {
      console.log("[PARTNER_STOREFRONT_GET] Pas de session ou pas d'ID utilisateur")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    // Vérifier si l'utilisateur existe et a le bon rôle
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partners: true }
    })
    console.log("[PARTNER_STOREFRONT_GET] Utilisateur trouvé:", user)
    
    if (!user) {
      console.log("[PARTNER_STOREFRONT_GET] Utilisateur non trouvé dans la base de données")
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    if (user.role !== "PARTNER") {
      console.log("[PARTNER_STOREFRONT_GET] L'utilisateur n'a pas le rôle PARTNER")
      return new NextResponse("Accès non autorisé", { status: 403 })
    }

    // Trouver le partenaire de l'utilisateur
    let partner = user.partners[0]
    if (!partner) {
      console.log("[PARTNER_STOREFRONT_GET] Aucun partenaire trouvé pour l'utilisateur, création automatique...")
      
      // Créer automatiquement le partenaire avec des données par défaut
      partner = await prisma.partner.create({
        data: {
          companyName: user.name || 'Nouveau Partenaire',
          description: 'Description par défaut',
          serviceType: 'LIEU', // Type par défaut
          billingStreet: 'Adresse à compléter',
          billingCity: 'Ville à compléter',
          billingPostalCode: '00000',
          billingCountry: 'France',
          siret: '00000000000000',
          vatNumber: 'FR00000000000',
          interventionType: 'all_france',
          interventionRadius: 50,
          userId: user.id,
          latitude: null,
          longitude: null,
          basePrice: null,
          priceRange: null,
          services: [],
          maxCapacity: null,
          minCapacity: null,
          options: {},
          searchableOptions: {},
          interventionCities: [],
        }
      })
      
      console.log("[PARTNER_STOREFRONT_GET] Partenaire créé automatiquement:", partner.id)
    }

    console.log("[PARTNER_STOREFRONT_GET] Recherche du storefront pour le partenaire:", partner.id)
    let storefront = await prisma.partnerStorefront.findFirst({
      where: { partnerId: partner.id },
      include: {
        media: true,
        partner: true,
      },
    })
    
    console.log("[PARTNER_STOREFRONT_GET] Résultat de la recherche:", storefront)
    if (!storefront) {
      console.log("[PARTNER_STOREFRONT_GET] Aucun storefront trouvé pour le partenaire, création automatique...")
      
      // Créer automatiquement le storefront
      storefront = await prisma.partnerStorefront.create({
        data: {
          type: 'PARTNER',
          isActive: false,
          partnerId: partner.id
        },
        include: {
          media: true,
          partner: true,
        },
      })
      
      console.log("[PARTNER_STOREFRONT_GET] Storefront créé automatiquement:", storefront.id)
    }
    
    // Debug: afficher les options du partenaire
    console.log("[PARTNER_STOREFRONT_GET] DEBUG - partner.options:", partner.options);
    console.log("[PARTNER_STOREFRONT_GET] DEBUG - partner.serviceType:", partner.serviceType);
    
    // Retourner une structure simplifiée et cohérente
    const responseData = {
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
      updatedAt: storefront.updatedAt
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_GET] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log("[PARTNER_STOREFRONT_POST] Session:", session)
    
    if (!session?.user?.id) {
      console.log("[PARTNER_STOREFRONT_POST] Pas de session ou pas d'ID utilisateur")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    console.log("[PARTNER_STOREFRONT_POST] Données reçues:", body)

    const validatedData = storefrontSchema.parse(body)
    console.log("[PARTNER_STOREFRONT_POST] Données validées:", validatedData)
    
    // Vérifier si l'utilisateur existe et a le bon rôle
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partners: true }
    })

    if (!user) {
      console.log("[PARTNER_STOREFRONT_POST] Utilisateur non trouvé")
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    if (user.role !== "PARTNER") {
      console.log("[PARTNER_STOREFRONT_POST] L'utilisateur n'a pas le rôle PARTNER")
      return new NextResponse("Accès non autorisé", { status: 403 })
    }

    // Trouver le partenaire de l'utilisateur
    const partner = user.partners[0]
    if (!partner) {
      console.log("[PARTNER_STOREFRONT_POST] Aucun partenaire trouvé pour l'utilisateur")
      return new NextResponse("Partenaire non trouvé", { status: 404 })
    }

    // Vérifier si une vitrine existe déjà pour ce partenaire
    const existingStorefront = await prisma.partnerStorefront.findFirst({
      where: { partnerId: partner.id },
    })

    let storefront
    if (existingStorefront) {
      console.log("[PARTNER_STOREFRONT_POST] Vitrine existante trouvée, mise à jour...")
      
      // Mettre à jour la vitrine existante
      storefront = await prisma.partnerStorefront.update({
        where: { id: existingStorefront.id },
        data: {
          ...validatedData,
        },
        include: {
          media: true,
          partner: true,
        },
      })
    } else {
      console.log("[PARTNER_STOREFRONT_POST] Création d'une nouvelle vitrine...")
      
      // Créer la nouvelle vitrine
      storefront = await prisma.partnerStorefront.create({
        data: {
          ...validatedData,
          partnerId: partner.id,
        },
        include: {
          media: true,
          partner: true,
        },
      })
    }

    console.log("[PARTNER_STOREFRONT_POST] Vitrine créée:", storefront)
    return NextResponse.json(storefront)
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_POST] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log("[PARTNER_STOREFRONT_PUT] Session:", session)
    
    if (!session?.user?.id) {
      console.log("[PARTNER_STOREFRONT_PUT] Pas de session ou pas d'ID utilisateur")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    console.log("[PARTNER_STOREFRONT_PUT] Données reçues:", body)

    const validatedData = storefrontSchema.partial().parse(body)
    console.log("[PARTNER_STOREFRONT_PUT] Données validées:", validatedData)

    // Vérifier si l'utilisateur existe et a le bon rôle
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partners: true }
    })

    if (!user) {
      console.log("[PARTNER_STOREFRONT_PUT] Utilisateur non trouvé")
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    if (user.role !== "PARTNER") {
      console.log("[PARTNER_STOREFRONT_PUT] L'utilisateur n'a pas le rôle PARTNER")
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
      console.log(`[PARTNER_STOREFRONT_PUT] ServiceType changé de ${partner.serviceType} vers ${newServiceType}`);
      
      const providerType = SERVICE_TO_PROVIDER_MAPPING[newServiceType];
      if (providerType) {
        // Initialiser les options pour le nouveau type de service
        updatedOptions = {
          ...updatedOptions,
          [providerType]: {}
        };
        console.log(`[PARTNER_STOREFRONT_PUT] Options initialisées pour ${providerType}:`, updatedOptions);
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
      },
    })

    console.log("[PARTNER_STOREFRONT_PUT] Vitrine mise à jour:", updatedStorefront.id)
    
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
      // Métadonnées
      createdAt: updatedStorefront.createdAt,
      updatedAt: updatedStorefront.updatedAt
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_PUT] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ServiceType, VenueType, StorefrontType } from "@prisma/client"

const storefrontSchema = z.object({
  type: z.nativeEnum(StorefrontType),
  isActive: z.boolean(),
  logo: z.string().nullable(),
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
    const partner = user.partners[0]
    if (!partner) {
      console.log("[PARTNER_STOREFRONT_GET] Aucun partenaire trouvé pour l'utilisateur")
      return new NextResponse("Partenaire non trouvé", { status: 404 })
    }

    console.log("[PARTNER_STOREFRONT_GET] Recherche du storefront pour le partenaire:", partner.id)
    const storefront = await prisma.partnerStorefront.findFirst({
      where: { partnerId: partner.id },
      include: {
        media: true,
        partner: true,
      },
    })
    
    console.log("[PARTNER_STOREFRONT_GET] Résultat de la recherche:", storefront)
    if (!storefront) {
      console.log("[PARTNER_STOREFRONT_GET] Aucun storefront trouvé pour le partenaire")
      return new NextResponse("Storefront non trouvé", { status: 404 })
    }
    
    return NextResponse.json(storefront)
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

    if (existingStorefront) {
      console.log("[PARTNER_STOREFRONT_POST] Vitrine existante trouvée")
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

    // Mettre à jour la vitrine
    const updatedStorefront = await prisma.partnerStorefront.update({
      where: { id: existingStorefront.id },
      data: validatedData,
      include: {
        media: true,
        partner: true,
      },
    })

    console.log("[PARTNER_STOREFRONT_PUT] Vitrine mise à jour:", updatedStorefront)
    return NextResponse.json(updatedStorefront)
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_PUT] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 
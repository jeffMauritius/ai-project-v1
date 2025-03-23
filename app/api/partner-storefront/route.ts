import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ServiceType, VenueType } from "@prisma/client"

const storefrontSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  description: z.string().min(1, "La description est requise"),
  serviceType: z.nativeEnum(ServiceType),
  venueType: z.nativeEnum(VenueType).optional(),
  billingStreet: z.string().min(1, "L'adresse de facturation est requise"),
  billingCity: z.string().min(1, "La ville de facturation est requise"),
  billingPostalCode: z.string().min(1, "Le code postal de facturation est requis"),
  billingCountry: z.string().min(1, "Le pays de facturation est requis"),
  siret: z.string().min(1, "Le numéro SIRET est requis"),
  vatNumber: z.string().min(1, "Le numéro de TVA est requis"),
  venueAddress: z.string().optional(),
  venueLatitude: z.number().optional(),
  venueLongitude: z.number().optional(),
  interventionType: z.string().default("all_france"),
  interventionRadius: z.number().optional().default(50),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log("[PARTNER_STOREFRONT_GET] Session:", session)
    
    if (!session?.user?.id) {
      console.log("[PARTNER_STOREFRONT_GET] Pas de session ou pas d'ID utilisateur")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    // Vérifier si l'utilisateur existe et a le bon rôle
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
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

    console.log("[PARTNER_STOREFRONT_GET] Recherche du storefront pour l'utilisateur:", session.user.id)
    
    const storefront = await prisma.partnerStorefront.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        media: true,
        receptionSpaces: true,
        receptionOptions: true,
        user: true,
      },
    })

    console.log("[PARTNER_STOREFRONT_GET] Résultat de la recherche:", storefront)

    if (!storefront) {
      console.log("[PARTNER_STOREFRONT_GET] Aucun storefront trouvé pour l'utilisateur")
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
    const validatedData = storefrontSchema.parse(body)
    
    // Vérifier si une vitrine existe déjà pour cet utilisateur
    const existingStorefront = await prisma.partnerStorefront.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    if (existingStorefront) {
      console.log("[PARTNER_STOREFRONT_POST] Vitrine existante trouvée")
      return new NextResponse("Une vitrine existe déjà pour cet utilisateur", { status: 400 })
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    if (!user) {
      console.log("[PARTNER_STOREFRONT_POST] Utilisateur non trouvé")
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    // Créer la vitrine
    const storefront = await prisma.partnerStorefront.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        media: true,
        receptionSpaces: true,
        receptionOptions: true,
        user: true,
      },
    })

    console.log("[PARTNER_STOREFRONT_POST] Vitrine créée avec succès:", storefront)
    return NextResponse.json(storefront)
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_POST] Erreur:", error)
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log("[PARTNER_STOREFRONT_PUT] Début de la mise à jour")
    
    const session = await getServerSession(authOptions)
    console.log("[PARTNER_STOREFRONT_PUT] Session:", session?.user)

    if (!session?.user?.id) {
      console.log("[PARTNER_STOREFRONT_PUT] Pas de session utilisateur")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    console.log("[PARTNER_STOREFRONT_PUT] Données reçues:", body)

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    console.log("[PARTNER_STOREFRONT_PUT] Utilisateur trouvé:", user)

    if (!user) {
      console.log("[PARTNER_STOREFRONT_PUT] Utilisateur non trouvé")
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    // Vérifier si la vitrine existe
    const existingStorefront = await prisma.partnerStorefront.findUnique({
      where: { userId: user.id },
    })
    console.log("[PARTNER_STOREFRONT_PUT] Vitrine existante:", existingStorefront)

    if (!existingStorefront) {
      console.log("[PARTNER_STOREFRONT_PUT] Vitrine non trouvée")
      return new NextResponse("Vitrine non trouvée", { status: 404 })
    }

    // Mettre à jour la vitrine
    const updatedStorefront = await prisma.partnerStorefront.update({
      where: { userId: user.id },
      data: {
        companyName: body.companyName,
        description: body.description,
        logo: body.logo,
        isActive: body.isActive,
        billingStreet: body.billingStreet,
        billingCity: body.billingCity,
        billingPostalCode: body.billingPostalCode,
        billingCountry: body.billingCountry,
        siret: body.siret,
        vatNumber: body.vatNumber,
        venueAddress: body.venueAddress,
        venueLatitude: body.venueLatitude,
        venueLongitude: body.venueLongitude,
        interventionType: body.interventionType,
        interventionRadius: body.interventionRadius,
      },
      include: {
        media: true,
        receptionSpaces: true,
        receptionOptions: true,
        user: true,
      },
    })
    console.log("[PARTNER_STOREFRONT_PUT] Vitrine mise à jour:", updatedStorefront)

    return NextResponse.json(updatedStorefront)
  } catch (error: any) {
    console.error("[PARTNER_STOREFRONT_PUT] Erreur:", error)
    return new NextResponse(
      `Erreur lors de la mise à jour de la vitrine: ${error.message}`,
      { status: 500 }
    )
  }
} 
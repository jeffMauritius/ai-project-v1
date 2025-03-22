import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const storefront = await prisma.partnerStorefront.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json(storefront)
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_GET]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log("[PARTNER_STOREFRONT_POST] Session:", session)
    
    if (!session?.user?.id) {
      console.log("[PARTNER_STOREFRONT_POST] Pas de session ou pas d'ID utilisateur")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await req.json()
    console.log("[PARTNER_STOREFRONT_POST] Body:", body)
    
    // Vérifier que tous les champs requis sont présents
    const requiredFields = [
      "companyName",
      "description",
      "billingStreet",
      "billingCity",
      "billingPostalCode",
      "billingCountry",
      "siret",
      "vatNumber"
    ]

    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      console.log("[PARTNER_STOREFRONT_POST] Champs manquants:", missingFields)
      return new NextResponse(
        `Champs requis manquants: ${missingFields.join(", ")}`,
        { status: 400 }
      )
    }
    
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
        ...body,
        userId: session.user.id,
      },
    })

    console.log("[PARTNER_STOREFRONT_POST] Vitrine créée avec succès:", storefront)
    return NextResponse.json(storefront)
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_POST] Erreur:", error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 })
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
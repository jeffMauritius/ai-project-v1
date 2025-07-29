import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ServiceType, VenueType } from "@prisma/client"

const storefrontSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis").max(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(2000, "La description ne peut pas dépasser 2000 caractères"),
  serviceType: z.nativeEnum(ServiceType, {
    errorMap: () => ({ message: "Veuillez sélectionner un type de service valide" })
  }),
  venueType: z.nativeEnum(VenueType).nullable(),
  billingStreet: z.string().min(1, "L'adresse de facturation est requise").max(200, "L'adresse de facturation ne peut pas dépasser 200 caractères"),
  billingCity: z.string().min(1, "La ville est requise").max(100, "La ville ne peut pas dépasser 100 caractères"),
  billingPostalCode: z.string().min(1, "Le code postal est requis").regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
  billingCountry: z.string().min(1, "Le pays est requis").max(100, "Le pays ne peut pas dépasser 100 caractères"),
  siret: z.string().min(1, "Le numéro SIRET est requis").regex(/^\d{14}$/, "Le numéro SIRET doit contenir exactement 14 chiffres"),
  vatNumber: z.string().min(1, "Le numéro de TVA est requis").regex(/^[A-Z]{2}[0-9A-Z]+$/, "Le numéro de TVA doit commencer par 2 lettres majuscules suivies de chiffres et lettres"),
  venueAddress: z.string().nullable(),
  venueLatitude: z.number().min(-90).max(90),
  venueLongitude: z.number().min(-180).max(180),
  interventionType: z.string().min(1, "Le type d'intervention est requis"),
  interventionRadius: z.number().min(1, "Le rayon d'intervention doit être supérieur à 0").max(1000, "Le rayon d'intervention ne peut pas dépasser 1000 km"),
  isActive: z.boolean(),
  logo: z.string().nullable(),
  id: z.string().optional(),
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
          receptionSpaces: true,
          receptionOptions: true,
          user: true,
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
      where: { userId: session.user.id },
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
    console.log("[PARTNER_STOREFRONT_POST] Données reçues:", body)

    const validatedData = storefrontSchema.parse(body)
    console.log("[PARTNER_STOREFRONT_POST] Données validées:", validatedData)
    
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

    const validatedData = storefrontSchema.parse(body)
    console.log("[PARTNER_STOREFRONT_PUT] Données validées:", validatedData)

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

    // Préparer les données pour la mise à jour (exclure les champs non modifiables)
    const { id, ...updateData } = validatedData

    // Mettre à jour la vitrine
    const updatedStorefront = await prisma.partnerStorefront.update({
      where: { userId: user.id },
      data: updateData,
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
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    return new NextResponse(
      `Erreur lors de la mise à jour de la vitrine: ${error.message}`,
      { status: 500 }
    )
  }
} 
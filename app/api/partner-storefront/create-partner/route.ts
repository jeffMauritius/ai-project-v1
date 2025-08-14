import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ServiceType } from "@prisma/client"

const partnerSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  description: z.string().min(1, "La description est requise"),
  serviceType: z.nativeEnum(ServiceType),
  billingStreet: z.string().min(1, "L'adresse de facturation est requise"),
  billingCity: z.string().min(1, "La ville est requise"),
  billingPostalCode: z.string().min(1, "Le code postal est requis"),
  billingCountry: z.string().min(1, "Le pays est requis"),
  siret: z.string().min(1, "Le numéro SIRET est requis"),
  vatNumber: z.string().min(1, "Le numéro de TVA est requis"),
  interventionType: z.string().default("all_france"),
  interventionRadius: z.number().default(50),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log("[CREATE_PARTNER] Session:", session)
    
    if (!session?.user?.id) {
      console.log("[CREATE_PARTNER] Pas de session ou pas d'ID utilisateur")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    console.log("[CREATE_PARTNER] Données reçues:", body)

    const validatedData = partnerSchema.parse(body)
    console.log("[CREATE_PARTNER] Données validées:", validatedData)
    
    // Vérifier si l'utilisateur existe et a le bon rôle
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { partners: true }
    })

    if (!user) {
      console.log("[CREATE_PARTNER] Utilisateur non trouvé")
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    if (user.role !== "PARTNER") {
      console.log("[CREATE_PARTNER] L'utilisateur n'a pas le rôle PARTNER")
      return new NextResponse("Accès non autorisé", { status: 403 })
    }

    // Vérifier si l'utilisateur a déjà un partenaire
    if (user.partners.length > 0) {
      console.log("[CREATE_PARTNER] L'utilisateur a déjà un partenaire")
      return new NextResponse("L'utilisateur a déjà un partenaire", { status: 400 })
    }

    // Créer le partenaire
    const partner = await prisma.partner.create({
      data: {
        ...validatedData,
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
      },
    })

    console.log("[CREATE_PARTNER] Partenaire créé:", partner.id)
    return NextResponse.json(partner)
  } catch (error) {
    console.error("[CREATE_PARTNER] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 
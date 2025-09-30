import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const recommendedPartnerSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  image: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  description: z.string().min(1),
  website: z.string().optional(),
  featured: z.boolean().optional(),
  originalPartnerId: z.string().optional()
})

// GET - Récupérer les partenaires recommandés de l'utilisateur
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const recommendedPartners = await prisma.recommendedPartner.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ partners: recommendedPartners })

  } catch (error) {
    console.error("Error fetching recommended partners:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des partenaires recommandés" },
      { status: 500 }
    )
  }
}

// POST - Ajouter un partenaire recommandé
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = recommendedPartnerSchema.parse(body)

    const recommendedPartner = await prisma.recommendedPartner.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        rating: validatedData.rating || 4.5
      }
    })

    return NextResponse.json({ partner: recommendedPartner })

  } catch (error) {
    console.error("Error creating recommended partner:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du partenaire recommandé" },
      { status: 500 }
    )
  }
}

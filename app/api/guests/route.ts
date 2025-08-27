import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer tous les groupes d'invités de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const guestGroups = await prisma.guestGroup.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        guests: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(guestGroups)
  } catch (error) {
    console.error("[GUESTS_GET] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
}

// POST - Créer un nouveau groupe d'invités
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { name, type, count, confirmed, notes } = body

    if (!name || !type || !count) {
      return new NextResponse("Nom, type et nombre d'invités requis", { status: 400 })
    }

    const guestGroup = await prisma.guestGroup.create({
      data: {
        name,
        type,
        count: parseInt(count),
        confirmed: confirmed || false,
        notes: notes || "",
        userId: session.user.id
      },
      include: {
        guests: true
      }
    })

    return NextResponse.json(guestGroup)
  } catch (error) {
    console.error("[GUESTS_POST] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 
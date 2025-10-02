import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer tous les invités individuels de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const individualGuests = await prisma.guest.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(individualGuests)
  } catch (error) {
    console.error("[INDIVIDUAL_GUESTS_GET] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
}

// POST - Créer un nouvel invité individuel
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, email, groupId, status } = body

    if (!firstName || !lastName || !email || !groupId || !status) {
      return new NextResponse("Tous les champs sont requis", { status: 400 })
    }

    // Vérifier que le groupe appartient à l'utilisateur
    const group = await prisma.guestGroup.findFirst({
      where: {
        id: groupId,
        userId: session.user.id
      }
    })

    if (!group) {
      return new NextResponse("Groupe non trouvé", { status: 404 })
    }

    // Vérifier si un invité avec ce nom complet existe déjà pour cet utilisateur
    const existingGuest = await prisma.guest.findFirst({
      where: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userId: session.user.id
      }
    })

    if (existingGuest) {
      return new NextResponse(
        `Un invité avec le nom "${firstName.trim()} ${lastName.trim()}" existe déjà`, 
        { status: 409 }
      )
    }

    // Vérifier que le groupe n'a pas atteint sa limite d'invités
    const currentGuestCount = await prisma.guest.count({
      where: {
        groupId: groupId
      }
    })

    if (currentGuestCount >= group.count) {
      return new NextResponse(
        `Ce groupe a atteint sa limite de ${group.count} invités. Impossible d'ajouter un invité supplémentaire.`, 
        { status: 400 }
      )
    }

    const individualGuest = await prisma.guest.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        status,
        userId: session.user.id,
        groupId
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json(individualGuest)
  } catch (error) {
    console.error("[INDIVIDUAL_GUESTS_POST] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
}

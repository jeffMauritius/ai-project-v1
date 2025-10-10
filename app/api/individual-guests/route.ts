import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer tous les invités individuels de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
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
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// POST - Créer un nouvel invité individuel
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, email, groupId, status } = body

    if (!firstName || !lastName || !email || !status) {
      return NextResponse.json({ error: "Les champs prénom, nom, email et statut sont requis" }, { status: 400 })
    }

    // Vérifier que le groupe appartient à l'utilisateur (seulement si un groupe est fourni)
    if (groupId) {
      const group = await prisma.guestGroup.findFirst({
        where: {
          id: groupId,
          userId: session.user.id
        }
      })

      if (!group) {
        return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 })
      }
      
      // Vérifier que le groupe n'a pas atteint sa limite d'invités
      const currentGuestCount = await prisma.guest.count({
        where: {
          groupId: groupId
        }
      })

      if (currentGuestCount >= group.count) {
        return NextResponse.json(
          { error: `Ce groupe a atteint sa limite de ${group.count} invités. Impossible d'ajouter un invité supplémentaire.` }, 
          { status: 400 }
        )
      }
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
      return NextResponse.json(
        { error: `Un invité avec le nom "${firstName.trim()} ${lastName.trim()}" existe déjà` }, 
        { status: 409 }
      )
    }

    const individualGuest = await prisma.guest.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        status,
        userId: session.user.id,
        groupId: groupId || null
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
  } catch (error: any) {
    console.error("[INDIVIDUAL_GUESTS_POST] Erreur:", error)
    
    // Gérer les erreurs de contrainte unique Prisma
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      const field = error.meta?.target?.[1] || 'email'
      return NextResponse.json(
        { error: `Un invité avec cet ${field} existe déjà` }, 
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

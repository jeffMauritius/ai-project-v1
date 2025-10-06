import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - Mettre à jour un invité individuel
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, email, groupId, status } = body

    if (!firstName || !lastName || !email || !groupId || !status) {
      return new NextResponse("Tous les champs sont requis", { status: 400 })
    }

    // Vérifier que l'invité appartient à l'utilisateur
    const existingGuest = await prisma.guest.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingGuest) {
      return new NextResponse("Invité non trouvé", { status: 404 })
    }

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if ((firstName.trim() !== existingGuest.firstName) || (lastName.trim() !== existingGuest.lastName)) {
      const duplicateGuest = await prisma.guest.findFirst({
        where: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userId: session.user.id,
          id: { not: id } // Exclure l'invité actuel
        }
      })

      if (duplicateGuest) {
        return new NextResponse(
          `Un invité avec le nom "${firstName.trim()} ${lastName.trim()}" existe déjà`, 
          { status: 409 }
        )
      }
    }

    // Vérifier que le nouveau groupe appartient à l'utilisateur
    const group = await prisma.guestGroup.findFirst({
      where: {
        id: groupId,
        userId: session.user.id
      }
    })

    if (!group) {
      return new NextResponse("Groupe non trouvé", { status: 404 })
    }

    const updatedGuest = await prisma.guest.update({
      where: {
        id
      },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        status,
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

    return NextResponse.json(updatedGuest)
  } catch (error) {
    console.error("[INDIVIDUAL_GUESTS_PUT] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
}

// DELETE - Supprimer un invité individuel
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { id } = await params

    // Vérifier que l'invité appartient à l'utilisateur
    const existingGuest = await prisma.guest.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingGuest) {
      return new NextResponse("Invité non trouvé", { status: 404 })
    }

    await prisma.guest.delete({
      where: {
        id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[INDIVIDUAL_GUESTS_DELETE] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
}

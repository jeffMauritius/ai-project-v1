import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - Mettre à jour un groupe d'invités
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Vérifier que le groupe appartient à l'utilisateur
    const existingGroup = await prisma.guestGroup.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingGroup) {
      return new NextResponse("Groupe non trouvé", { status: 404 })
    }

    const updatedGroup = await prisma.guestGroup.update({
      where: {
        id: params.id
      },
      data: {
        name,
        type,
        count: parseInt(count),
        confirmed: confirmed || false,
        notes: notes || ""
      },
      include: {
        guests: true
      }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error("[GUESTS_PUT] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
}

// DELETE - Supprimer un groupe d'invités
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    // Vérifier que le groupe appartient à l'utilisateur
    const existingGroup = await prisma.guestGroup.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingGroup) {
      return new NextResponse("Groupe non trouvé", { status: 404 })
    }

    // Supprimer le groupe (les invités individuels seront supprimés automatiquement via onDelete: Cascade)
    await prisma.guestGroup.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GUESTS_DELETE] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 
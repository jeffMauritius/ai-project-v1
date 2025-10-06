import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE - Supprimer un partenaire recommandé
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le partenaire appartient à l'utilisateur
    const recommendedPartner = await prisma.recommendedPartner.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!recommendedPartner) {
      return NextResponse.json(
        { error: "Partenaire recommandé non trouvé" },
        { status: 404 }
      )
    }

    await prisma.recommendedPartner.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error deleting recommended partner:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du partenaire recommandé" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un partenaire recommandé
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Vérifier que le partenaire appartient à l'utilisateur
    const existingPartner = await prisma.recommendedPartner.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingPartner) {
      return NextResponse.json(
        { error: "Partenaire recommandé non trouvé" },
        { status: 404 }
      )
    }

    const updatedPartner = await prisma.recommendedPartner.update({
      where: { id: id },
      data: body
    })

    return NextResponse.json({ partner: updatedPartner })

  } catch (error) {
    console.error("Error updating recommended partner:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du partenaire recommandé" },
      { status: 500 }
    )
  }
}

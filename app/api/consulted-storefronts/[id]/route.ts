import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE - Supprimer une vitrine consultée
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

    // Vérifier que la consultation appartient à l'utilisateur
    const consultation = await prisma.consultedStorefront.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!consultation) {
      return new NextResponse("Consultation non trouvée", { status: 404 })
    }

    // Supprimer la consultation
    await prisma.consultedStorefront.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[CONSULTED_STOREFRONTS_DELETE] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 
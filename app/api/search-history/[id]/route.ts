import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE - Supprimer une recherche de l'historique
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { id } = params

    // Vérifier que la recherche appartient à l'utilisateur
    const searchHistory = await prisma.searchHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!searchHistory) {
      return new NextResponse("Recherche non trouvée", { status: 404 })
    }

    // Supprimer la recherche
    await prisma.searchHistory.delete({
      where: {
        id
      }
    })

    return NextResponse.json({ message: "Recherche supprimée avec succès" })
  } catch (error) {
    console.error("[SEARCH_HISTORY_DELETE] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 
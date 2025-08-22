import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Mettre à jour les statuts des résultats dans l'historique
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { storefrontId, name, action } = body // action: 'add' ou 'remove'

    if (!storefrontId || !name || !action) {
      return new NextResponse("Paramètres manquants", { status: 400 })
    }

    // Récupérer tous les historiques de recherche de l'utilisateur
    const searchHistory = await prisma.searchHistory.findMany({
      where: {
        userId: session.user.id
      }
    })

    // Mettre à jour les statuts dans chaque historique
    for (const history of searchHistory) {
      if (Array.isArray(history.results)) {
        const updatedResults = history.results.map((result: any) => {
          if (result.name === name || result.storefrontId === storefrontId) {
            return {
              ...result,
              status: action === 'add' ? 'Sauvegardé' : 'Consulté'
            }
          }
          return result
        })

        // Mettre à jour l'historique seulement si des changements ont été faits
        if (JSON.stringify(updatedResults) !== JSON.stringify(history.results)) {
          await prisma.searchHistory.update({
            where: { id: history.id },
            data: { results: updatedResults }
          })
        }
      }
    }

    return NextResponse.json({ message: "Statuts mis à jour avec succès" })
  } catch (error) {
    console.error("[SEARCH_HISTORY_UPDATE_STATUS] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 
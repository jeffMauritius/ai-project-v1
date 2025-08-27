import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer l'historique des recherches de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const searchHistory = await prisma.searchHistory.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limiter à 50 dernières recherches
    })

    // Récupérer les favoris de l'utilisateur pour vérifier les statuts
    const userFavorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        storefrontId: true,
        name: true
      }
    })

    // Créer un map des favoris pour une recherche rapide
    const favoritesMap = new Map()
    userFavorites.forEach(fav => {
      favoritesMap.set(fav.name.toLowerCase(), fav.storefrontId)
    })

    // Formater les données pour l'affichage avec vérification des favoris
    const formattedHistory = searchHistory.map(item => ({
      id: item.id,
      date: item.createdAt.toISOString().split('T')[0],
      type: item.type === 'LIEU' ? 'Lieu' : 'Prestataire',
      query: item.query,
      results: Array.isArray(item.results) ? item.results.map(result => ({
        ...result,
        status: favoritesMap.has(result.name.toLowerCase()) ? 'Sauvegardé' : result.status
      })) : []
    }))

    return NextResponse.json(formattedHistory)
  } catch (error) {
    console.error("[SEARCH_HISTORY_GET] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
}

// POST - Sauvegarder une nouvelle recherche
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { query, type, results } = body

    if (!query || !type) {
      return new NextResponse("Requête et type requis", { status: 400 })
    }

    // Sauvegarder la recherche
    const searchHistory = await prisma.searchHistory.create({
      data: {
        query,
        type: type.toUpperCase(),
        results: results || [],
        userId: session.user.id
      }
    })

    return NextResponse.json(searchHistory)
  } catch (error) {
    console.error("[SEARCH_HISTORY_POST] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 
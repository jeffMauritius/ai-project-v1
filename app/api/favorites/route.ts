import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer les favoris de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Enrichir les favoris avec les images des storefronts
    const enrichedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          const storefront = await prisma.partnerStorefront.findUnique({
            where: { id: favorite.storefrontId },
            include: {
              media: {
                take: 1,
                orderBy: { order: 'asc' }
              }
            }
          })

          return {
            ...favorite,
            imageUrl: storefront?.media[0]?.url || favorite.imageUrl || '/placeholder-venue.jpg'
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du storefront ${favorite.storefrontId}:`, error)
          return {
            ...favorite,
            imageUrl: favorite.imageUrl || '/placeholder-venue.jpg'
          }
        }
      })
    )

    return NextResponse.json(enrichedFavorites)
  } catch (error) {
    console.error("[FAVORITES_GET] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

// POST - Ajouter un favori
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { storefrontId, name, location, rating, numberOfReviews, description, imageUrl } = body

    if (!storefrontId) {
      return new NextResponse("ID du storefront requis", { status: 400 })
    }

    // Vérifier si le storefront existe
    const storefront = await prisma.partnerStorefront.findUnique({
      where: { id: storefrontId }
    })

    if (!storefront) {
      return new NextResponse("Storefront non trouvé", { status: 404 })
    }

    // Vérifier si le favori existe déjà
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_storefrontId: {
          userId: session.user.id,
          storefrontId: storefrontId
        }
      }
    })

    if (existingFavorite) {
      return new NextResponse("Ce favori existe déjà", { status: 409 })
    }

    // Créer le favori
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        storefrontId: storefrontId,
        name: name || "Lieu sans nom",
        location: location || "Localisation non spécifiée",
        rating: rating || 0,
        numberOfReviews: numberOfReviews || 0,
        description: description || "",
        imageUrl: imageUrl || null
      }
    })

    return NextResponse.json(favorite)
  } catch (error) {
    console.error("[FAVORITES_POST] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

// DELETE - Supprimer un favori
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storefrontId = searchParams.get('storefrontId')

    if (!storefrontId) {
      return new NextResponse("ID du storefront requis", { status: 400 })
    }

    // Supprimer le favori
    const deletedFavorite = await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        storefrontId: storefrontId
      }
    })

    if (deletedFavorite.count === 0) {
      return new NextResponse("Favori non trouvé", { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[FAVORITES_DELETE] Erreur:", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 
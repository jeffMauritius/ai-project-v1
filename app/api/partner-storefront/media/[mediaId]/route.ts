import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { mediaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const mediaId = params.mediaId

    // Vérifier que le média appartient bien à la vitrine du partenaire
    const media = await prisma.media.findUnique({
      where: {
        id: mediaId,
      },
      include: {
        storefront: true,
      },
    })

    if (!media || media.storefront.userId !== session.user.id) {
      return new NextResponse("Média non trouvé ou non autorisé", { status: 404 })
    }

    // TODO: Supprimer le fichier du service de stockage
    // Pour l'instant, on supprime juste l'entrée dans la base de données

    await prisma.media.delete({
      where: {
        id: mediaId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_MEDIA_DELETE]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 
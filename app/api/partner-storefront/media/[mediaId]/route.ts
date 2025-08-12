import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le média avec le storefront et le partenaire
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        storefront: {
          include: {
            partner: true
          }
        }
      }
    })

    if (!media) {
      return NextResponse.json({ error: 'Média non trouvé' }, { status: 404 })
    }

    // Vérifier que l'utilisateur possède ce storefront via le partenaire
    if (media.storefront.partner && media.storefront.partner.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Supprimer le média
    await prisma.media.delete({
      where: { id: mediaId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur lors de la suppression du média:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 
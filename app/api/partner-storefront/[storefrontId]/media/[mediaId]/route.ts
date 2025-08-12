import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { del } from '@vercel/blob'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storefrontId: string; mediaId: string }> }
) {
  try {
    const { storefrontId, mediaId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur possède ce storefront
    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        id: storefrontId,
        partner: {
          userId: session.user.id
        }
      }
    })

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront non trouvé' }, { status: 404 })
    }

    // Récupérer le média
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        storefrontId: storefrontId
      }
    })

    if (!media) {
      return NextResponse.json({ error: 'Média non trouvé' }, { status: 404 })
    }

    // Supprimer le fichier de Vercel Blob Storage
    if (media.url.startsWith('https://')) {
      await del(media.url)
    }

    // Supprimer le média de la base de données
    await prisma.media.delete({
      where: {
        id: mediaId
      }
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
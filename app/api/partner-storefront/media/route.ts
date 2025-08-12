import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storefrontId: string }> }
) {
  try {
    const { storefrontId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le storefront avec le partenaire
    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        id: storefrontId,
        partner: {
          userId: session.user.id
        }
      },
      include: {
        media: true
      }
    })

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront non trouvé' }, { status: 404 })
    }

    return NextResponse.json(storefront.media)

  } catch (error) {
    console.error('Erreur lors de la récupération des médias:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storefrontId: string }> }
) {
  try {
    const { storefrontId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { url, type, title, description, order } = body

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

    // Créer le nouveau média
    const media = await prisma.media.create({
      data: {
        url,
        type,
        title: title || '',
        description: description || '',
        order: order || 0,
        storefrontId: storefrontId
      }
    })

    return NextResponse.json(media)

  } catch (error) {
    console.error('Erreur lors de la création du média:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'

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

    // Traiter l'upload de fichier
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux' }, { status: 400 })
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Type de fichier non supporté' }, { status: 400 })
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${storefrontId}/${timestamp}.${fileExtension}`

    // Upload vers Vercel Blob Storage
    const blob = await put(fileName, file, {
      access: 'public',
    })

    // Utiliser l'URL du blob
    const fileUrl = blob.url

    // Déterminer le type de média
    const mediaType = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO'

    // Créer le média dans la base de données
    const media = await prisma.media.create({
      data: {
        url: fileUrl,
        type: mediaType,
        title: title || file.name,
        description: description || '',
        order: 0,
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
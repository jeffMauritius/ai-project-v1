import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import { transformImageUrlWithEntity } from '@/lib/image-url-transformer'

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

    // Transformer les URLs des médias
    const transformedMedia = storefront.media.map((media, index) => ({
      ...media,
      url: transformImageUrlWithEntity(media.url, storefrontId, 'partners', index + 1)
    }))
    
    return NextResponse.json(transformedMedia)

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
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 })
    }

    // Liste blanche des types MIME autorisés (sécurité renforcée)
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

    if (!allowedTypes.includes(file.type)) {
      console.warn('[SECURITY] Rejected file upload - invalid type:', { type: file.type, storefrontId })
      return NextResponse.json({ error: 'Type de fichier non supporté. Formats acceptés: JPG, PNG, GIF, WebP, MP4, WebM' }, { status: 400 })
    }

    // Valider l'extension du fichier (double vérification)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      console.warn('[SECURITY] Rejected file upload - invalid extension:', { extension: fileExtension, storefrontId })
      return NextResponse.json({ error: 'Extension de fichier non supportée' }, { status: 400 })
    }

    // Vérifier la cohérence entre MIME type et extension
    const isImage = allowedImageTypes.includes(file.type)
    const isImageExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)
    const isVideo = allowedVideoTypes.includes(file.type)
    const isVideoExtension = ['mp4', 'webm', 'mov'].includes(fileExtension)

    if ((isImage && !isImageExtension) || (isVideo && !isVideoExtension)) {
      console.warn('[SECURITY] Rejected file upload - MIME/extension mismatch:', { type: file.type, extension: fileExtension, storefrontId })
      return NextResponse.json({ error: 'Type de fichier incohérent' }, { status: 400 })
    }

    // Générer un nom de fichier unique et sécurisé (sans utiliser le nom original)
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const safeExtension = fileExtension.replace(/[^a-z0-9]/g, '')
    const fileName = `${storefrontId}/${timestamp}-${randomSuffix}.${safeExtension}`

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
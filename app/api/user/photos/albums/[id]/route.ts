import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import { z } from 'zod'

const updateAlbumSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1)
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Non autorisé', { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const data = updateAlbumSchema.parse(body)

    const album = await prisma.photoAlbum.findUnique({
      where: { id },
      include: { photos: true }
    })

    if (!album) {
      return new NextResponse('Album non trouvé', { status: 404 })
    }

    if (album.userId !== session.user.id) {
      return new NextResponse('Accès interdit', { status: 403 })
    }

    const updatedAlbum = await prisma.photoAlbum.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      },
      include: { photos: true }
    })

    return NextResponse.json(updatedAlbum)
  } catch (error: any) {
    console.error('[ALBUM_PUT] error', error)
    return new NextResponse(error?.message || 'Erreur serveur', { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Non autorisé', { status: 401 })
    }

    const { id } = params

    const album = await prisma.photoAlbum.findUnique({
      where: { id },
      include: { photos: true }
    })

    if (!album) {
      return new NextResponse('Album non trouvé', { status: 404 })
    }

    if (album.userId !== session.user.id) {
      return new NextResponse('Accès interdit', { status: 403 })
    }

    // Delete all photos from blob storage
    for (const photo of album.photos) {
      try {
        await del(photo.url)
      } catch (e) {
        console.warn('[ALBUM_DELETE] Failed to delete blob:', photo.url, e)
      }
    }

    // Delete album (photos will be deleted due to cascade)
    await prisma.photoAlbum.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[ALBUM_DELETE] error', error)
    return new NextResponse(error?.message || 'Erreur serveur', { status: 500 })
  }
}

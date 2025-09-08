import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Non autorisé', { status: 401 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return new NextResponse('Content-Type invalide', { status: 400 })
    }

    const formData = await req.formData()
    const albumId = formData.get('albumId')?.toString() || undefined
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return new NextResponse('Aucun fichier', { status: 400 })
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error('Uniquement des images sont acceptées')
        }
        if (file.size > 2 * 1024 * 1024) {
          throw new Error('Chaque fichier doit faire moins de 2MB')
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const blob = await put(`user-${session.user.id}/${Date.now()}-${file.name}`, buffer, {
          access: 'public',
          contentType: file.type,
        })

        const photo = await prisma.userPhoto.create({
          data: {
            url: blob.url,
            size: file.size,
            mimeType: file.type,
            userId: session.user.id,
            albumId,
          },
        })
        return photo
      })
    )

    return NextResponse.json(uploads)
  } catch (error: any) {
    console.error('[USER_PHOTOS_POST] error', error)
    return new NextResponse(error?.message || 'Erreur serveur', { status: 500 })
  }
} 
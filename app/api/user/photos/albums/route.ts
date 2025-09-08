import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const albumSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1)
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Non autorisé', { status: 401 })
    }

    const albums = await prisma.photoAlbum.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { photos: true }
    })

    return NextResponse.json(albums)
  } catch (error) {
    console.error('[USER_ALBUMS_GET] error', error)
    return new NextResponse('Erreur serveur', { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Non autorisé', { status: 401 })
    }

    const body = await req.json()
    const data = albumSchema.parse(body)

    const album = await prisma.photoAlbum.create({
      data: {
        name: data.name,
        description: data.description,
        userId: session.user.id
      }
    })

    return NextResponse.json(album)
  } catch (error: any) {
    console.error('[USER_ALBUMS_POST] error', error)
    return new NextResponse(error?.message || 'Erreur serveur', { status: 500 })
  }
} 
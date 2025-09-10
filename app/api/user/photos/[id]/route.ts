import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

export const runtime = 'nodejs'

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

    const photo = await prisma.userPhoto.findUnique({ where: { id } })
    if (!photo) {
      return new NextResponse('Photo non trouvée', { status: 404 })
    }
    if (photo.userId !== session.user.id) {
      return new NextResponse('Accès interdit', { status: 403 })
    }

    try {
      await del(photo.url)
    } catch (e) {
      console.warn('[USER_PHOTO_DELETE] Échec suppression blob, on continue:', e)
    }

    await prisma.userPhoto.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[USER_PHOTO_DELETE] error', error)
    return new NextResponse(error?.message || 'Erreur serveur', { status: 500 })
  }
}

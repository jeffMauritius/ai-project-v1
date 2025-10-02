import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/guest-groups/[id] - Mettre à jour un groupe d'invités
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name, type, count, confirmed, notes } = await request.json()

    // Vérifier que le groupe appartient à l'utilisateur
    const existingGroup = await prisma.guestGroup.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Guest group not found' }, { status: 404 })
    }

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (name && name.trim() !== existingGroup.name) {
      const duplicateGroup = await prisma.guestGroup.findFirst({
        where: {
          name: name.trim(),
          userId: session.user.id,
          id: { not: id } // Exclure le groupe actuel
        }
      })

      if (duplicateGroup) {
        return NextResponse.json({ 
          error: 'Un groupe avec ce nom existe déjà' 
        }, { status: 409 })
      }
    }

    const updatedGroup = await prisma.guestGroup.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(count !== undefined && { count }),
        ...(confirmed !== undefined && { confirmed }),
        ...(notes !== undefined && { notes: notes.trim() })
      },
      include: {
        guests: true
      }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Error updating guest group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/guest-groups/[id] - Supprimer un groupe d'invités
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le groupe appartient à l'utilisateur
    const existingGroup = await prisma.guestGroup.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Guest group not found' }, { status: 404 })
    }

    // Supprimer le groupe (les invités individuels seront supprimés automatiquement via onDelete: Cascade)
    await prisma.guestGroup.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting guest group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

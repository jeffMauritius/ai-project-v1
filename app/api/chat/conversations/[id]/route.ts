import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/chat/conversations/[id] - Supprimer une conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID de conversation requis' }, { status: 400 })
    }

    // Vérifier que la conversation appartient à l'utilisateur OU au partenaire
    // Cela permet un accès bi-directionnel aux conversations
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        OR: [
          { userId: session.user.id },
          { partnerId: session.user.id }
        ]
      }
    })

    if (!conversation) {
      // Log pour monitoring de sécurité
      console.warn('[SECURITY] Unauthorized conversation access attempt:', {
        userId: session.user.id,
        conversationId: id
      })
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 })
    }

    // Supprimer d'abord les messages associés à la conversation
    await prisma.message.deleteMany({
      where: {
        conversationId: id
      }
    })

    // Supprimer la conversation
    await prisma.conversation.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation supprimée avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression de la conversation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    )
  }
}

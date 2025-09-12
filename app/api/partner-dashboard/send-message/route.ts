import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/partner-dashboard/send-message - Envoyer une réponse du fournisseur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, content, messageType = 'text', metadata } = await request.json()

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Conversation ID and content are required' }, { status: 400 })
    }

    // Vérifier que le fournisseur a accès à cette conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        storefront: {
          OR: [
            { establishment: { userId: session.user.id } },
            { partner: { userId: session.user.id } }
          ]
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    // Créer le message du fournisseur
    const message = await prisma.message.create({
      data: {
        conversationId: conversationId,
        senderType: 'provider',
        senderId: session.user.id,
        content: content,
        messageType: messageType,
        metadata: metadata,
        deliveredAt: new Date()
      }
    })

    // Mettre à jour la conversation avec le dernier message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: {
          content: content,
          timestamp: new Date(),
          senderType: 'provider'
        },
        unreadCount: {
          user: (conversation.unreadCount as any).user + 1
        },
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      id: message.id,
      content: message.content,
      senderType: 'provider',
      createdAt: message.createdAt
    })
  } catch (error) {
    console.error('Error sending partner message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

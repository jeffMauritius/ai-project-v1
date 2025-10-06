import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastMessage } from '../events/route'

// POST /api/chat/send-message - Envoyer un message (simulation temps réel)
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

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId: conversationId,
        senderType: 'user',
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
          senderType: 'user'
        },
        unreadCount: {
          provider: (conversation.unreadCount as any).provider + 1
        },
        updatedAt: new Date()
      }
    })

    // Diffuser le message via SSE
    console.log('📢 Diffusion du message utilisateur via SSE:', {
      conversationId,
      messageId: message.id,
      content: message.content,
      senderType: message.senderType
    })
    
    broadcastMessage(conversationId, {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      senderType: message.senderType,
      senderName: session.user.name || session.user.email || 'Utilisateur',
      senderEmail: session.user.email || '',
      createdAt: message.createdAt.toISOString(),
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

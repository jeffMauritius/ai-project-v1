import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/messages?conversationId=xxx - Récupérer les messages d'une conversation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Récupérer les messages avec pagination
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Marquer les messages comme lus
    await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderType: 'provider',
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    })

    // Mettre à jour le compteur de messages non lus
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        unreadCount: {
          user: 0
        }
      }
    })

    return NextResponse.json(messages.reverse()) // Inverser pour avoir l'ordre chronologique
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/chat/messages - Envoyer un message
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
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
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

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastMessage } from '../chat/events/route'

// POST /api/test-send-message - Envoyer une réponse du fournisseur
export async function POST(request: NextRequest) {
  console.log('DEBUG - API test-send-message appelée')
  try {
    const session = await getServerSession(authOptions)
    console.log('DEBUG - Session:', session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, content, messageType = 'text', metadata } = await request.json()

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Conversation ID and content are required' }, { status: 400 })
    }

    // Vérifier que le fournisseur a accès à cette conversation
    console.log('DEBUG - Conversation ID:', conversationId)
    console.log('DEBUG - Session user ID:', session.user.id)
    
    // D'abord, récupérer le partenaire de l'utilisateur connecté
    const partner = await prisma.partner.findFirst({
      where: {
        userId: session.user.id
      }
    })
    
    console.log('DEBUG - Partenaire trouvé:', partner?.id)
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }
    
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        storefront: {
          partnerId: partner.id
        }
      }
    })
    
    console.log('DEBUG - Conversation trouvée:', conversation ? 'OUI' : 'NON')

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        content,
        messageType,
        metadata: metadata || null,
        senderType: 'provider',
        senderId: session.user.id,
        conversationId,
        deliveredAt: new Date()
      }
    })

    // Mettre à jour la conversation avec le dernier message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        lastMessage: {
          content,
          timestamp: new Date().toISOString(),
          senderType: 'provider'
        }
      }
    })

    // Diffuser le message via SSE
    broadcastMessage(conversationId, {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      senderType: message.senderType,
      senderName: session.user.name || session.user.email || 'Partenaire',
      senderEmail: session.user.email || '',
      createdAt: message.createdAt.toISOString(),
    })

    return NextResponse.json({ message })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
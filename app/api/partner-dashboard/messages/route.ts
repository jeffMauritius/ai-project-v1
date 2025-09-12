import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/partner-dashboard/messages - Récupérer les conversations du fournisseur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer les conversations où le fournisseur est impliqué
    const conversations = await prisma.conversation.findMany({
      where: {
        storefront: {
          OR: [
            { establishment: { userId: session.user.id } },
            { partner: { userId: session.user.id } }
          ]
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        storefront: {
          select: {
            id: true,
            type: true,
            establishment: {
              select: { name: true }
            },
            partner: {
              select: { companyName: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50 // Limiter à 50 derniers messages
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Transformer les données pour l'interface
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      client: {
        name: conv.user.name || 'Utilisateur',
        avatar: conv.user.image || '',
        type: conv.storefront.type === 'VENUE' ? 'Lieu de mariage' : 'Prestataire'
      },
      messages: conv.messages.map(msg => ({
        id: msg.id,
        sender: msg.senderType === 'user' ? 'client' : 'partner',
        content: msg.content,
        date: msg.createdAt.toISOString(),
        read: !!msg.readAt
      })),
      lastMessage: conv.lastMessage ? (conv.lastMessage as any).content : 'Aucun message',
      date: conv.updatedAt.toISOString(),
      unread: (conv.unreadCount as any).provider > 0,
      quoteRequest: {
        id: conv.id,
        status: conv.status,
        eventDate: new Date().toISOString(), // À remplacer par des vraies données
        guestCount: 'Non spécifié',
        eventType: 'Mariage',
        venueLocation: 'Non spécifié',
        budget: 'Non spécifié',
        message: conv.lastMessage ? (conv.lastMessage as any).content : null,
        customerEmail: conv.user.email || '',
        customerName: conv.user.name || 'Utilisateur'
      }
    }))

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Error fetching partner messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
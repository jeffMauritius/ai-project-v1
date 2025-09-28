import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/partner-dashboard/messages?conversationId=xxx - Récupérer les messages d'une conversation ou toutes les conversations (pour les partenaires)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    // Trouver le partenaire associé à cet utilisateur
    const partner = await prisma.partner.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Trouver les storefronts du partenaire
    const storefronts = await prisma.partnerStorefront.findMany({
      where: { partnerId: partner.id },
      select: { id: true }
    })

    const storefrontIds = storefronts.map(s => s.id)

    if (conversationId) {
      // Récupérer les messages d'une conversation spécifique
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          storefrontId: {
            in: storefrontIds
          }
        }
      })

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Récupérer les messages
      const messages = await prisma.message.findMany({
        where: {
          conversationId: conversationId
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      // Marquer les messages comme lus
      await prisma.message.updateMany({
        where: {
          conversationId: conversationId,
          senderType: 'user',
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
            provider: 0
          }
        }
      })

      return NextResponse.json(messages)
    } else {
      // Récupérer toutes les conversations du partenaire
      const conversations = await prisma.conversation.findMany({
        where: {
          storefrontId: {
            in: storefrontIds
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          storefront: {
            select: {
              id: true,
              type: true,
              establishment: {
                select: {
                  id: true,
                  name: true
                }
              },
              partner: {
                select: {
                  id: true,
                  companyName: true,
                  serviceType: true
                }
              }
            }
          },
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })

      // Transformer les données pour correspondre au format attendu par le frontend
      const formattedConversations = conversations.map(conv => {
        const lastMessage = conv.messages[0]
        const participants = conv.participants as any
        
        return {
          id: conv.id,
          client: {
            name: participants?.user?.name || conv.user.name || 'Utilisateur',
            avatar: '', // Pas d'avatar pour l'instant
            type: conv.storefront.type === 'VENUE' 
              ? conv.storefront.establishment?.name || 'Lieu'
              : conv.storefront.partner?.serviceType || 'Prestataire'
          },
          messages: [], // Les messages seront chargés séparément
          lastMessage: lastMessage?.content || '',
          date: lastMessage?.createdAt.toISOString() || conv.updatedAt.toISOString(),
          unread: (conv.unreadCount as any)?.provider > 0,
          quoteRequest: {
            id: conv.id,
            status: 'active',
            eventDate: '',
            guestCount: '',
            eventType: '',
            venueLocation: '',
            budget: '',
            message: lastMessage?.content || null,
            customerEmail: participants?.user?.email || conv.user.email || '',
            customerName: participants?.user?.name || conv.user.name || 'Utilisateur'
          }
        }
      })

      console.log('📋 Conversations formatées pour le partenaire:', formattedConversations.length)
      console.log('📋 Détails:', JSON.stringify(formattedConversations, null, 2))
      
      return NextResponse.json({ conversations: formattedConversations })
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
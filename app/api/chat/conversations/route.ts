import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/conversations - Récupérer les conversations de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
        status: 'active'
      },
      include: {
        storefront: {
          select: {
            id: true,
            type: true,
            establishment: {
              select: {
                name: true,
                imageUrl: true
              }
            },
            partner: {
              select: {
                companyName: true,
                serviceType: true,
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transformer les données pour l'affichage
    const formattedConversations = conversations.map(conv => {
      const storefront = conv.storefront
      const isVenue = storefront.type === 'VENUE'
      
      return {
        id: conv.id,
        storefrontId: conv.storefrontId,
        partner: {
          name: isVenue 
            ? storefront.establishment?.name 
            : storefront.partner?.companyName,
          type: isVenue 
            ? 'Lieu' 
            : storefront.partner?.serviceType,
          avatar: isVenue 
            ? storefront.establishment?.imageUrl 
            : storefront.partner?.images?.[0]
        },
        lastMessage: conv.lastMessage ? {
          content: conv.lastMessage.content,
          timestamp: conv.lastMessage.timestamp,
          senderType: conv.lastMessage.senderType
        } : null,
        unreadCount: conv.unreadCount,
        updatedAt: conv.updatedAt
      }
    })

    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/chat/conversations - Créer une nouvelle conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { storefrontId } = await request.json()

    if (!storefrontId) {
      return NextResponse.json({ error: 'Storefront ID is required' }, { status: 400 })
    }

    // Vérifier si la conversation existe déjà
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: session.user.id,
        storefrontId: storefrontId
      }
    })

    if (conversation) {
      return NextResponse.json(conversation)
    }

    // Récupérer les informations du storefront
    const storefront = await prisma.partnerStorefront.findUnique({
      where: { id: storefrontId },
      include: {
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
    })

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront not found' }, { status: 404 })
    }

    // Déterminer les informations du fournisseur
    const isVenue = storefront.type === 'VENUE'
    const providerInfo = isVenue 
      ? {
          id: storefront.establishment?.id,
          companyName: storefront.establishment?.name,
          type: 'VENUE'
        }
      : {
          id: storefront.partner?.id,
          companyName: storefront.partner?.companyName,
          type: storefront.partner?.serviceType
        }

    // Créer la conversation
    conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        storefrontId: storefrontId,
        participants: {
          user: {
            id: session.user.id,
            name: session.user.name || 'Utilisateur',
            email: session.user.email || ''
          },
          provider: providerInfo
        }
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

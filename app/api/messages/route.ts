import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Envoyer un message
export async function POST(request: NextRequest) {
  try {
    console.log('📨 [API MESSAGES] Début de la requête POST')
    
    // Récupérer et logger le body de la requête
    const body = await request.json()
    console.log('📋 [API MESSAGES] Body reçu:', JSON.stringify(body, null, 2))
    
    const { conversationId, partnerId, storefrontId, content } = body
    
    console.log('🔍 [API MESSAGES] Paramètres extraits:')
    console.log('  - conversationId:', conversationId)
    console.log('  - partnerId:', partnerId)
    console.log('  - storefrontId:', storefrontId)
    console.log('  - content:', content)
    
    // Vérifier que le contenu est fourni
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      console.log('❌ [API MESSAGES] Contenu manquant ou invalide')
      return NextResponse.json({ error: 'Contenu du message requis' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [API MESSAGES] Utilisateur non autorisé')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.log('❌ [API MESSAGES] Utilisateur non trouvé:', session.user.email)
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    console.log('✅ [API MESSAGES] Utilisateur trouvé:', user.id)

    let conversation

    // Si conversationId est fourni, l'utiliser directement
    if (conversationId) {
      console.log('💬 [API MESSAGES] Utilisation du conversationId existant:', conversationId)
      
      // Vérifier que la conversation existe et que l'utilisateur y a accès
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { clientId: user.id },
            { partnerId: user.id }
          ]
        },
        include: { client: true, partner: true }
      })

      if (!conversation) {
        console.log('❌ [API MESSAGES] Conversation non trouvée ou accès refusé:', conversationId)
        return NextResponse.json({ error: 'Conversation non trouvée ou accès refusé' }, { status: 404 })
      }

      console.log('✅ [API MESSAGES] Conversation trouvée:', conversation.id)
    }
    // Sinon, essayer de créer une nouvelle conversation
    else if (storefrontId || partnerId) {
      console.log('🆕 [API MESSAGES] Création d\'une nouvelle conversation')
      console.log('📋 [API MESSAGES] partnerId:', partnerId, 'storefrontId:', storefrontId)
      
      let partnerUserId: string
      
      if (storefrontId) {
        console.log('🏪 [API MESSAGES] Recherche via storefrontId:', storefrontId)
        
        // Récupérer le partenaire via le storefront
      const storefront = await prisma.partnerStorefront.findUnique({
        where: { id: storefrontId },
        include: { partner: true }
        })

        if (!storefront || !storefront.partner) {
          console.log('❌ [API MESSAGES] Storefront ou partenaire non trouvé')
          return NextResponse.json({ error: 'Storefront ou partenaire non trouvé' }, { status: 404 })
        }

        partnerUserId = storefront.partner.userId
        console.log('👤 [API MESSAGES] PartnerUserId via storefront:', partnerUserId)
        
      } else if (partnerId) {
        console.log('👤 [API MESSAGES] Recherche via partnerId:', partnerId)
        
        // Vérifier si c'est un ID d'utilisateur ou un email
        if (partnerId.includes('@')) {
          // C'est un email, chercher l'utilisateur
          const partner = await prisma.user.findUnique({
            where: { email: partnerId }
          })
          if (!partner || partner.role !== 'PARTNER') {
            console.log('❌ [API MESSAGES] Partenaire non trouvé par email:', partnerId)
            return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
          }
          partnerUserId = partner.id
        } else {
          // C'est un ID d'utilisateur, vérifier qu'il existe et est un partenaire
          const partner = await prisma.user.findUnique({
            where: { id: partnerId }
          })
          if (!partner || partner.role !== 'PARTNER') {
            console.log('❌ [API MESSAGES] Partenaire non trouvé par ID:', partnerId)
            return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
          }
          partnerUserId = partner.id
        }
        
        console.log('👤 [API MESSAGES] PartnerUserId via partnerId:', partnerUserId)
      } else {
        console.log('❌ [API MESSAGES] Aucun ID de partenaire ou de storefront fourni')
        return NextResponse.json({ error: 'ID de partenaire ou de storefront requis' }, { status: 400 })
      }

      // Vérifier s'il existe déjà une conversation entre ces utilisateurs
      console.log('🔍 [API MESSAGES] Recherche de conversation existante...')
      conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { clientId: user.id, partnerId: partnerUserId },
            { clientId: partnerUserId, partnerId: user.id }
          ]
        }
      })

      if (!conversation) {
        console.log('🆕 [API MESSAGES] Création d\'une nouvelle conversation...')
        
        // Créer une nouvelle conversation
        conversation = await prisma.conversation.create({
          data: {
            clientId: user.id,
            partnerId: partnerUserId,
            lastMessageAt: new Date(),
            unreadCount: 1
          },
          include: { client: true, partner: true }
        })
        
        console.log('✅ [API MESSAGES] Nouvelle conversation créée:', conversation.id)
      } else {
        console.log('✅ [API MESSAGES] Conversation existante trouvée:', conversation.id)
      }
    } else {
      console.log('❌ [API MESSAGES] Aucun paramètre valide fourni')
      return NextResponse.json({ error: 'ID de conversation, de partenaire ou de storefront requis' }, { status: 400 })
    }

    console.log('💬 [API MESSAGES] Création du message...')

    // Créer le message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: user.id,
        conversationId: conversation.id,
        read: false
      }
    })

    console.log('✅ [API MESSAGES] Message créé:', message.id)

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: {
          increment: 1
        }
      }
    })

    console.log('✅ [API MESSAGES] Conversation mise à jour')

    const response = { 
      success: true, 
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        conversationId: message.conversationId,
        createdAt: message.createdAt,
        read: message.read
      },
      conversation: {
        id: conversation.id,
        clientId: conversation.clientId,
        partnerId: conversation.partnerId
      }
    }

    console.log('✅ [API MESSAGES] Réponse envoyée:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [API MESSAGES] Erreur lors de l\'envoi du message:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// GET - Récupérer les conversations d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    console.log('📨 [API MESSAGES] Début de la requête GET')
    
    const { searchParams } = new URL(request.url)
    const storefrontId = searchParams.get('storefrontId')
    
    if (storefrontId) {
      console.log('🏪 [API MESSAGES] Requête GET avec storefrontId:', storefrontId)
      
      // Récupérer les messages d'un storefront spécifique
      const storefront = await prisma.partnerStorefront.findUnique({
        where: { id: storefrontId },
        include: { partner: true }
      })

      if (!storefront || !storefront.partner) {
        console.log('❌ [API MESSAGES] Storefront ou partenaire non trouvé')
        return NextResponse.json({ error: 'Storefront ou partenaire non trouvé' }, { status: 404 })
      }

      console.log('✅ [API MESSAGES] Storefront trouvé:', storefront.id)

      // Récupérer ou créer une conversation pour ce storefront
      let conversation = await prisma.conversation.findFirst({
        where: {
          partnerId: storefront.partner.userId
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      })

      if (!conversation) {
        console.log('🆕 [API MESSAGES] Création d\'une nouvelle conversation pour le storefront')
        // Créer une conversation vide pour ce storefront
        conversation = {
          id: `temp-${storefrontId}`,
          messages: [],
          client: null
        }
      } else {
        console.log('✅ [API MESSAGES] Conversation existante trouvée:', conversation.id)
      }

      // Formater les messages pour l'affichage
      const formattedMessages = conversation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        isOwn: false // Sera déterminé côté client
      }))

      const conversationData = {
        id: conversation.id,
        messages: formattedMessages,
        storefront: {
          id: storefront.id,
          name: storefront.partner.companyName || 'Partenaire'
        }
      }

      console.log('✅ [API MESSAGES] Conversation formatée envoyée avec', formattedMessages.length, 'messages')
      return NextResponse.json({ conversation: conversationData })
    }

    // Requête GET standard pour récupérer toutes les conversations
    console.log('🔐 [API MESSAGES] Vérification de l\'authentification...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ [API MESSAGES] Utilisateur non autorisé - pas de session')
      return NextResponse.json({ 
        error: 'Non autorisé - Veuillez vous connecter',
        code: 'UNAUTHORIZED'
      }, { status: 401 })
    }

    console.log('✅ [API MESSAGES] Session trouvée pour:', session.user.email)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.log('❌ [API MESSAGES] Utilisateur non trouvé en base:', session.user.email)
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      }, { status: 404 })
    }

    console.log('✅ [API MESSAGES] Utilisateur trouvé en base:', user.id)

    // Récupérer toutes les conversations de l'utilisateur
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { clientId: user.id },
          { partnerId: user.id }
        ]
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    console.log('✅ [API MESSAGES] Conversations trouvées:', conversations.length)

    // Formater les conversations pour l'affichage
    const formattedConversations = conversations
      .filter(conv => {
        // Filtrer les conversations avec des utilisateurs valides
        const isClient = conv.clientId === user.id
        const otherUser = isClient ? conv.partner : conv.client
        
        if (!otherUser) {
          console.log('⚠️ [API MESSAGES] Conversation ignorée - utilisateur manquant:', conv.id)
          return false
        }
        
        return true
      })
      .map(conv => {
        const isClient = conv.clientId === user.id
        const otherUser = isClient ? conv.partner : conv.client
        const lastMessage = conv.messages[0]
        
        return {
          id: conv.id,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name || 'Utilisateur',
            avatar: otherUser.image || '/placeholder-venue.jpg',
            type: isClient ? 'Partenaire' : 'Client'
          },
          lastMessage: lastMessage?.content || 'Aucun message',
          date: lastMessage?.createdAt || conv.createdAt,
          unread: conv.unreadCount > 0,
          messageCount: conv._count.messages
        }
      })

    console.log('✅ [API MESSAGES] Conversations formatées:', formattedConversations.length)
    return NextResponse.json({ conversations: formattedConversations })

  } catch (error) {
    console.error('❌ [API MESSAGES] Erreur lors de la récupération des conversations:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
} 
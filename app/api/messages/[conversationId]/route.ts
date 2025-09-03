import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les messages d'une conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    console.log('📨 [API MESSAGES] Début de la requête GET pour conversation')
    
    // Attendre params pour Next.js 15
    const { conversationId } = await params
    
    if (!conversationId) {
      console.log('❌ [API MESSAGES] ID de conversation manquant')
      return NextResponse.json({ error: 'ID de conversation requis' }, { status: 400 })
    }

    console.log('🔍 [API MESSAGES] Récupération des messages pour conversation:', conversationId)

    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [API MESSAGES] Utilisateur non autorisé')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.log('❌ [API MESSAGES] Utilisateur non trouvé')
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer la conversation et vérifier l'accès
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      console.log('❌ [API MESSAGES] Conversation non trouvée:', conversationId)
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 })
    }

    // Vérifier que l'utilisateur a accès à cette conversation
    if (conversation.clientId !== user.id && conversation.partnerId !== user.id) {
      console.log('❌ [API MESSAGES] Accès non autorisé à la conversation')
      return NextResponse.json({ error: 'Accès non autorisé à cette conversation' }, { status: 403 })
    }

    console.log('✅ [API MESSAGES] Conversation trouvée, accès autorisé')

    // Marquer les messages non lus comme lus si l'utilisateur est le destinataire
    if (conversation.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 }
      })
      console.log('✅ [API MESSAGES] Messages marqués comme lus')
    }

    // Formater les messages pour l'affichage
    const formattedMessages = conversation.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      isOwn: msg.senderId === user.id,
      sender: {
        id: msg.sender.id,
        name: msg.sender.name || 'Utilisateur',
        avatar: msg.sender.image || '/placeholder-venue.jpg'
      },
      createdAt: msg.createdAt,
      read: true
    }))

    console.log('✅ [API MESSAGES] Messages formatés et envoyés:', formattedMessages.length)
    return NextResponse.json({ messages: formattedMessages })

  } catch (error) {
    console.error('❌ [API MESSAGES] Erreur lors de la récupération des messages:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
} 
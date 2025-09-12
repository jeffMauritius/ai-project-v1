import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

let io: ServerIO | null = null

export const initSocket = (httpServer: NetServer) => {
  if (io) return io

  io = new ServerIO(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  // Gestion des connexions
  io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id)

    // Authentification de la socket
    socket.on('authenticate', async (data) => {
      try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
          socket.emit('auth_error', { message: 'Unauthorized' })
          return
        }

        // Stocker l'ID utilisateur dans la socket
        socket.data.userId = session.user.id
        socket.data.userName = session.user.name
        socket.data.userEmail = session.user.email

        // Rejoindre la room de l'utilisateur
        socket.join(`user:${session.user.id}`)
        
        socket.emit('authenticated', { 
          userId: session.user.id,
          userName: session.user.name 
        })

        console.log(`User ${session.user.id} authenticated on socket ${socket.id}`)
      } catch (error) {
        console.error('Authentication error:', error)
        socket.emit('auth_error', { message: 'Authentication failed' })
      }
    })

    // Rejoindre une conversation
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data
        
        if (!socket.data.userId) {
          socket.emit('error', { message: 'Not authenticated' })
          return
        }

        // Vérifier que l'utilisateur a accès à cette conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            userId: socket.data.userId
          }
        })

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' })
          return
        }

        // Rejoindre la room de la conversation
        socket.join(`conversation:${conversationId}`)
        socket.emit('joined_conversation', { conversationId })

        console.log(`User ${socket.data.userId} joined conversation ${conversationId}`)
      } catch (error) {
        console.error('Join conversation error:', error)
        socket.emit('error', { message: 'Failed to join conversation' })
      }
    })

    // Envoyer un message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', metadata } = data
        
        if (!socket.data.userId) {
          socket.emit('error', { message: 'Not authenticated' })
          return
        }

        // Vérifier que l'utilisateur a accès à cette conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            userId: socket.data.userId
          },
          include: {
            storefront: {
              select: {
                type: true,
                establishment: {
                  select: { name: true }
                },
                partner: {
                  select: { companyName: true }
                }
              }
            }
          }
        })

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' })
          return
        }

        // Créer le message
        const message = await prisma.message.create({
          data: {
            conversationId: conversationId,
            senderType: 'user',
            senderId: socket.data.userId,
            content: content,
            messageType: messageType,
            metadata: metadata,
            deliveredAt: new Date()
          }
        })

        // Mettre à jour la conversation
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

        // Diffuser le message à tous les participants de la conversation
        io!.to(`conversation:${conversationId}`).emit('new_message', {
          id: message.id,
          conversationId: conversationId,
          content: content,
          senderType: 'user',
          senderId: socket.data.userId,
          senderName: socket.data.userName,
          messageType: messageType,
          metadata: metadata,
          createdAt: message.createdAt
        })

        // Notifier le fournisseur (si en ligne)
        const providerName = conversation.storefront.type === 'VENUE' 
          ? conversation.storefront.establishment?.name 
          : conversation.storefront.partner?.companyName

        io!.to(`provider:${conversation.storefrontId}`).emit('new_message_notification', {
          conversationId: conversationId,
          providerName: providerName,
          message: content,
          senderName: socket.data.userName
        })

        socket.emit('message_sent', { messageId: message.id })
      } catch (error) {
        console.error('Send message error:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Indicateur de frappe
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        isTyping: isTyping
      })
    })

    // Déconnexion
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export const getSocket = () => io

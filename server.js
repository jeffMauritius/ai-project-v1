const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialiser Socket.IO
  const { Server } = require('socket.io')
  
  // Import de Prisma
  const { prisma } = require('./lib/prisma.js')
  console.log('✅ Prisma chargé avec succès')

  if (server.io) {
    console.log('Socket.IO already initialized')
  } else {
    console.log('Initializing Socket.IO...')
    
    const io = new Server(server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    // Gestion des connexions
    io.on('connection', (socket) => {
      console.log('🔌 Nouvelle connexion Socket.IO:', socket.id)

      // Rejoindre une conversation
      socket.on('join-conversation', (conversationId) => {
        console.log(`🔌 Utilisateur ${socket.id} rejoint la conversation ${conversationId}`)
        socket.join(conversationId)
        socket.emit('joined-conversation', conversationId)
      })

      // Quitter une conversation
      socket.on('leave-conversation', (conversationId) => {
        console.log(`🔌 Utilisateur ${socket.id} quitte la conversation ${conversationId}`)
        socket.leave(conversationId)
      })

      // Nouveau message
      socket.on('new-message', async (data) => {
        console.log('💬 Nouveau message reçu:', data)

        try {
          // Validation des données d'entrée (sécurité)
          if (!data || typeof data !== 'object') {
            console.warn('[SECURITY] Invalid message data received')
            socket.emit('error', { message: 'Données de message invalides.' })
            return
          }

          // Validation du conversationId
          if (!data.conversationId || typeof data.conversationId !== 'string' || data.conversationId.length !== 24) {
            console.warn('[SECURITY] Invalid conversationId:', data.conversationId)
            socket.emit('error', { message: 'ID de conversation invalide.' })
            return
          }

          // Validation du contenu du message
          if (!data.content || typeof data.content !== 'string') {
            socket.emit('error', { message: 'Contenu du message requis.' })
            return
          }

          // Limite de taille du message (10000 caractères max)
          const MAX_MESSAGE_LENGTH = 10000
          if (data.content.length > MAX_MESSAGE_LENGTH) {
            socket.emit('error', { message: `Message trop long (max ${MAX_MESSAGE_LENGTH} caractères).` })
            return
          }

          // Nettoyer le contenu (supprimer les caractères de contrôle dangereux)
          const sanitizedContent = data.content
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Supprimer les caractères de contrôle
            .trim()

          if (!sanitizedContent) {
            socket.emit('error', { message: 'Le message ne peut pas être vide.' })
            return
          }

          // Validation du senderType
          const validSenderTypes = ['user', 'provider']
          if (!validSenderTypes.includes(data.senderType)) {
            console.warn('[SECURITY] Invalid senderType:', data.senderType)
            socket.emit('error', { message: 'Type d\'expéditeur invalide.' })
            return
          }

          // Validation du senderId (doit être fourni par le client authentifié)
          const senderId = data.senderId || 'anonymous'
          if (senderId === 'anonymous') {
            console.warn('[SECURITY] Message without senderId from socket:', socket.id)
          }

          // Sauvegarder le message dans la base de données
          const newMessage = await prisma.message.create({
            data: {
              conversationId: data.conversationId,
              senderType: data.senderType,
              senderId: senderId,
              content: sanitizedContent,
              messageType: 'text',
              deliveredAt: new Date(),
            },
          })

          // Mettre à jour la conversation avec le dernier message et le compteur de non lus
          const conversation = await prisma.conversation.findUnique({
            where: { id: data.conversationId },
          })

          if (conversation) {
            const updatedUnreadCount = { ...conversation.unreadCount }
            if (data.senderType === 'user') {
              updatedUnreadCount.provider = (updatedUnreadCount.provider || 0) + 1
            } else {
              updatedUnreadCount.user = (updatedUnreadCount.user || 0) + 1
            }

            await prisma.conversation.update({
              where: { id: data.conversationId },
              data: {
                lastMessage: {
                  content: newMessage.content,
                  timestamp: newMessage.createdAt,
                  senderType: newMessage.senderType,
                },
                unreadCount: updatedUnreadCount,
                updatedAt: new Date(),
              },
            })
          }

          // Diffuser le message à tous les participants de la conversation
          io.to(data.conversationId).emit('new-message', {
            id: newMessage.id,
            conversationId: newMessage.conversationId,
            content: newMessage.content,
            senderType: newMessage.senderType,
            senderName: data.senderName,
            senderEmail: data.senderEmail,
            createdAt: newMessage.createdAt.toISOString(),
          })
          
          console.log(`📢 Message diffusé dans ${data.conversationId}:`, newMessage.content)
        } catch (error) {
          console.error('❌ Erreur lors de l\'envoi ou de la sauvegarde du message:', error)
          socket.emit('error', { message: 'Erreur lors de l\'envoi du message.' })
        }
      })

      // Déconnexion
      socket.on('disconnect', () => {
        console.log('🔌 Utilisateur déconnecté:', socket.id)
      })
    })

    server.io = io
  }

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})

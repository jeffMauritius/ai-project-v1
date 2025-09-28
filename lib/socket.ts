import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiRequest } from 'next'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new SocketIOServer(res.socket.server, {
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
      socket.on('join-conversation', (conversationId: string) => {
        console.log(`🔌 Utilisateur ${socket.id} rejoint la conversation ${conversationId}`)
        socket.join(conversationId)
        socket.emit('joined-conversation', conversationId)
      })

      // Quitter une conversation
      socket.on('leave-conversation', (conversationId: string) => {
        console.log(`🔌 Utilisateur ${socket.id} quitte la conversation ${conversationId}`)
        socket.leave(conversationId)
      })

      // Nouveau message
      socket.on('new-message', (data: {
        conversationId: string
        content: string
        senderType: 'user' | 'provider'
        senderName: string
        senderEmail: string
      }) => {
        console.log('💬 Nouveau message reçu:', data)
        
        // Diffuser le message à tous les participants de la conversation
        socket.to(data.conversationId).emit('message-received', {
          id: Date.now().toString(), // ID temporaire
          conversationId: data.conversationId,
          content: data.content,
          senderType: data.senderType,
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          createdAt: new Date().toISOString(),
        })
      })

      // Déconnexion
      socket.on('disconnect', () => {
        console.log('🔌 Utilisateur déconnecté:', socket.id)
      })
    })

    res.socket.server.io = io
  }
  res.end()
}

export default SocketHandler

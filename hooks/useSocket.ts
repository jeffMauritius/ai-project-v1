import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  conversationId: string
  content: string
  senderType: 'user' | 'provider'
  senderName: string
  senderEmail: string
  createdAt: string
}

export const useSocket = () => {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Initialiser la connexion Socket.IO
  useEffect(() => {
    if (!session?.user?.id) return

    console.log('🔌 Initialisation Socket.IO...')
    
    const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    })

    // Connexion établie
    newSocket.on('connect', () => {
      console.log('✅ Connexion Socket.IO établie:', newSocket.id)
      setIsConnected(true)
      reconnectAttempts.current = 0
      
      // Rejoindre la conversation actuelle si elle existe
      if (currentConversationId) {
        newSocket.emit('join-conversation', currentConversationId)
      }
    })

    // Déconnexion
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Connexion Socket.IO fermée:', reason)
      setIsConnected(false)
      
      // Tentative de reconnexion automatique
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
        console.log(`🔄 Tentative de reconnexion ${reconnectAttempts.current + 1}/${maxReconnectAttempts} dans ${delay}ms`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++
          newSocket.connect()
        }, delay)
      }
    })

    // Erreur de connexion
    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket.IO:', error)
      setIsConnected(false)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      newSocket.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
    }
  }, [session?.user?.id])

  // Rejoindre une conversation
  const joinConversation = useCallback((conversationId: string) => {
    if (!socket || !isConnected) {
      console.log('⚠️ Socket non connecté, impossible de rejoindre la conversation')
      return
    }

    console.log('🔌 Rejoindre la conversation:', conversationId)
    socket.emit('join-conversation', conversationId)
    setCurrentConversationId(conversationId)
  }, [socket, isConnected])

  // Quitter une conversation
  const leaveConversation = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return

    console.log('🔌 Quitter la conversation:', conversationId)
    socket.emit('leave-conversation', conversationId)
    setCurrentConversationId(null)
  }, [socket, isConnected])

  // Envoyer un message
  const sendMessage = useCallback((conversationId: string, content: string, senderType: 'user' | 'provider', senderName: string, senderEmail: string) => {
    if (!socket || !isConnected) {
      console.log('⚠️ Socket non connecté, impossible d\'envoyer le message')
      return
    }

    console.log('💬 Envoi du message via Socket.IO:', { conversationId, content, senderType })
    
    socket.emit('new-message', {
      conversationId,
      content,
      senderType,
      senderName,
      senderEmail
    })
  }, [socket, isConnected])

  // Écouter les nouveaux messages
  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    if (!socket) return () => {}

    const handleMessage = (message: Message) => {
      console.log('💬 Nouveau message reçu via Socket.IO:', message)
      callback(message)
    }

    socket.on('message-received', handleMessage)
    
    return () => {
      socket.off('message-received', handleMessage)
    }
  }, [socket])

  // Écouter les erreurs
  const onError = useCallback((callback: (error: Error) => void) => {
    if (!socket) return () => {}

    const handleError = (error: Error) => {
      console.error('❌ Erreur Socket.IO:', error)
      callback(error)
    }

    socket.on('connect_error', handleError)
    
    return () => {
      socket.off('connect_error', handleError)
    }
  }, [socket])

  return {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    onNewMessage,
    onError,
  }
}
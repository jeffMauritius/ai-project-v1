'use client'

import { useEffect, useState, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { getSocket, disconnectSocket } from '@/lib/socket-client'

interface Message {
  id: string
  conversationId: string
  content: string
  senderType: 'user' | 'provider'
  senderId: string
  senderName?: string
  messageType: string
  metadata?: any
  createdAt: string
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  sendMessage: (conversationId: string, content: string, messageType?: string, metadata?: any) => void
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  onNewMessage: (callback: (message: Message) => void) => void
  onTyping: (callback: (data: { userId: string; userName: string; isTyping: boolean }) => void) => void
  emitTyping: (conversationId: string, isTyping: boolean) => void
}

export function useSocket(): UseSocketReturn {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    // Créer la connexion Socket.io
    const newSocket = getSocket()
    if (!newSocket) return

    socketRef.current = newSocket
    setSocket(newSocket)

    // Gestion des événements de connexion
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)
      
      // Authentifier la socket
      newSocket.emit('authenticate', {
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email
      })
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data)
    })

    newSocket.on('auth_error', (error) => {
      console.error('Socket authentication error:', error)
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    // Nettoyage à la déconnexion
    return () => {
      disconnectSocket()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
    }
  }, [session?.user?.id])

  const sendMessage = (conversationId: string, content: string, messageType = 'text', metadata?: any) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        conversationId,
        content,
        messageType,
        metadata
      })
    }
  }

  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', { conversationId })
    }
  }

  const leaveConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.leave(`conversation:${conversationId}`)
    }
  }

  const onNewMessage = (callback: (message: Message) => void) => {
    if (socket) {
      socket.on('new_message', callback)
    }
  }

  const onTyping = (callback: (data: { userId: string; userName: string; isTyping: boolean }) => void) => {
    if (socket) {
      socket.on('user_typing', callback)
    }
  }

  const emitTyping = (conversationId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', { conversationId, isTyping })
    }
  }

  return {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onTyping,
    emitTyping
  }
}

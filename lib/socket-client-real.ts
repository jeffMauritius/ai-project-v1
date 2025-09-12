'use client'

import { io, Socket } from 'socket.io-client'
import { useEffect, useState } from 'react'

let socket: Socket | null = null

export const useSocketReal = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null)

  useEffect(() => {
    // Initialiser Socket.io côté client
    if (typeof window !== 'undefined' && !socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        path: '/api/socket',
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      })

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id)
        setIsConnected(true)
        setSocketInstance(socket)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
      })
    }

    return () => {
      if (socket) {
        socket.disconnect()
        socket = null
        setIsConnected(false)
        setSocketInstance(null)
      }
    }
  }, [])

  return {
    socket: socketInstance,
    isConnected
  }
}

export const getSocket = () => socket




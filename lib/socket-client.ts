'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null
  
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/api/socket',
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    })
  }
  
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

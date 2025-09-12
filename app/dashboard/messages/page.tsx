'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/hooks/useSocket'

interface Conversation {
  id: string
  storefrontId: string
  partner: {
    name: string
    type: string
    avatar?: string
  }
  lastMessage: {
    content: string
    timestamp: string
    senderType: string
  } | null
  unreadCount: {
    user: number
    provider: number
  }
  updatedAt: string
}

interface Message {
  id: string
  content: string
  senderType: 'user' | 'provider'
  senderName?: string
  messageType: string
  createdAt: string
}

export default function Messages() {
  const { data: session } = useSession()
  // const { socket, isConnected, sendMessage, joinConversation, onNewMessage } = useSocket()
  const socket = null
  const isConnected = false
  const sendMessage = () => {}
  const joinConversation = () => {}
  const onNewMessage = () => {}
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Charger les conversations
  useEffect(() => {
    if (session?.user?.id) {
      loadConversations()
    }
  }, [session?.user?.id])

  // Écouter les nouveaux messages
  useEffect(() => {
    if (socket) {
      onNewMessage((message: Message) => {
        if (message.conversationId === selectedConversation) {
          setMessages(prev => [...prev, message])
        }
        // Mettre à jour la liste des conversations
        loadConversations()
      })
    }
  }, [socket, onNewMessage, selectedConversation])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)
    joinConversation(conversationId)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation,
          content: newMessage.trim(),
          messageType: 'text'
        })
      })

      if (response.ok) {
        const sentMessage = await response.json()
        // Ajouter le message localement
        const userMessage: Message = {
          id: sentMessage.id,
          content: newMessage.trim(),
          senderType: 'user',
          senderName: session?.user?.name || 'Vous',
          messageType: 'text',
          createdAt: sentMessage.createdAt
        }
        setMessages(prev => [...prev, userMessage])
        setNewMessage('')
        
        // Recharger les conversations pour mettre à jour la liste
        loadConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto h-[calc(100vh-9rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-9rem)]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Messages</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex overflow-hidden">
        {/* Liste des conversations */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune conversation</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.partner.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conversation.lastMessage?.content || 'Aucun message'}
                      </p>
                      <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                        {conversation.partner.type}
                      </p>
                    </div>
                    {conversation.unreadCount.user > 0 && (
                      <span className="h-2 w-2 bg-pink-600 rounded-full"></span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Zone de conversation */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {conversations.find(c => c.id === selectedConversation)?.partner.name}
                  </h2>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {conversations.find(c => c.id === selectedConversation)?.partner.type}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    isConnected 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {isConnected ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucun message dans cette conversation</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === 'user'
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form className="flex space-x-4" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !isConnected}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Sélectionnez une conversation
              </h3>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
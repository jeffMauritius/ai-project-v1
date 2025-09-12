'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, User, Bot, Mic, LogIn } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/hooks/useSocket'
import Link from 'next/link'

interface ChatCardProps {
  companyName: string
  storefrontId: string
}

interface Message {
  id: string
  content: string
  senderType: 'user' | 'provider'
  senderName?: string
  messageType: string
  createdAt: string
}

export default function ChatCard({ companyName, storefrontId }: ChatCardProps) {
  const { data: session, status } = useSession()
  // const { socket, isConnected, sendMessage, joinConversation, onNewMessage, emitTyping } = useSocket()
  const socket = null
  const isConnected = false
  const sendMessage = () => {}
  const joinConversation = () => {}
  const onNewMessage = () => {}
  const emitTyping = () => {}
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll vers le bas (désactivé pour éviter la descente vers le footer)
  const scrollToBottom = () => {
    // Désactivé pour éviter les problèmes de scroll
    // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = useCallback(async () => {
    if (!conversationId) return

    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const messagesData = await response.json()
        setMessages(messagesData)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [conversationId])

  // Charger les messages existants
  useEffect(() => {
    if (conversationId && session?.user?.id) {
      loadMessages()
    }
  }, [conversationId, session?.user?.id, loadMessages])

  // Charger les messages au montage du composant si l'utilisateur est connecté
  useEffect(() => {
    if (session?.user?.id && !conversationId) {
      // Essayer de récupérer une conversation existante
      createOrGetConversation()
    }
  }, [session?.user?.id])

  // Écouter les nouveaux messages (désactivé pour l'instant)
  // useEffect(() => {
  //   if (socket) {
  //     onNewMessage((message: Message) => {
  //       setMessages(prev => [...prev, message])
  //     })
  //   }
  // }, [socket, onNewMessage])

  const createOrGetConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storefrontId }),
      })

      if (response.ok) {
        const conversation = await response.json()
        setConversationId(conversation.id)
        // joinConversation(conversation.id) // Désactivé pour l'instant
        
        // Charger les messages de cette conversation
        if (conversation.id) {
          try {
            const messagesResponse = await fetch(`/api/chat/messages?conversationId=${conversation.id}`)
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json()
              setMessages(messagesData)
            }
          } catch (error) {
            console.error('Error loading messages:', error)
          }
        }
        
        return conversation.id
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
    return null
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !session?.user?.id) return

    setIsLoading(true)

    try {
      // Créer ou récupérer la conversation si nécessaire
      let currentConversationId = conversationId
      if (!currentConversationId) {
        currentConversationId = await createOrGetConversation()
        if (!currentConversationId) {
          setIsLoading(false)
          return
        }
      }

      // Ajouter le message localement pour un feedback immédiat
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        content: inputValue.trim(),
        senderType: 'user',
        senderName: session.user.name || 'Vous',
        messageType: 'text',
        createdAt: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, userMessage])
      const messageContent = inputValue.trim()
      setInputValue('')
      
      // Pas de scroll automatique pour éviter la descente vers le footer
      
      // Envoyer le message via API
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          content: messageContent,
          messageType: 'text'
        })
      })

      if (response.ok) {
        const sentMessage = await response.json()
        // Remplacer le message temporaire par le vrai message
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id ? {
            ...msg,
            id: sentMessage.id,
            createdAt: sentMessage.createdAt
          } : msg
        ))
      } else {
        // En cas d'erreur, retirer le message temporaire
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
        console.error('Error sending message')
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    
    // Gérer l'indicateur de frappe (désactivé pour l'instant)
    // if (conversationId) {
    //   emitTyping(conversationId, true)
    //   
    //   // Clear previous timeout
    //   if (typingTimeoutRef.current) {
    //     clearTimeout(typingTimeoutRef.current)
    //   }
    //   
    //   // Set new timeout
    //   typingTimeoutRef.current = setTimeout(() => {
    //     emitTyping(conversationId, false)
    //   }, 1000)
    // }
  }

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    // Ici on pourrait intégrer l'API Web Speech Recognition
    // Pour l'instant, on simule juste le changement d'état
    if (!isRecording) {
      // Simuler la reconnaissance vocale
      setTimeout(() => {
        setInputValue('Bonjour, je souhaite des informations sur vos tarifs pour un mariage')
        setIsRecording(false)
      }, 2000)
    }
  }

  // Si l'utilisateur n'est pas connecté
  if (status === 'loading') {
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
        <div className="text-center p-6">
          <MessageCircle className="w-12 h-12 text-pink-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat en temps réel</h3>
          <p className="text-gray-600 mb-4">Pour utiliser cette fonctionnalité, vous devez créer un compte gratuit.</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Créer un compte
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-pink-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Chat en temps réel</h3>
            <p className="text-sm text-gray-600">Discutez avec {companyName}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Commencez une conversation avec {companyName}</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${message.senderType === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Heure au-dessus du message */}
            <p className="text-xs text-gray-500 mb-1 px-2">
              {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            
            {/* Message */}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderType === 'user'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.senderType === 'provider' && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.senderType === 'user' && (
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleVoiceInput}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Dictée vocale"
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            Chat en temps réel
          </p>
          <p className="text-xs text-gray-500">
            Réponse garantie sous 24h
          </p>
        </div>
      </div>
    </div>
  )
} 
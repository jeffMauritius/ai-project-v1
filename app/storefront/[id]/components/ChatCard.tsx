'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, User, Bot, Mic } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface ChatCardProps {
  companyName: string
  storefrontId: string
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function ChatCard({ companyName, storefrontId }: ChatCardProps & { storefrontId: string }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Charger les messages existants
  useEffect(() => {
    const loadMessages = async () => {
      try {
        console.log('📱 [CHAT] Chargement des messages pour storefront:', storefrontId)
        const response = await fetch(`/api/messages?storefrontId=${storefrontId}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [CHAT] Messages chargés:', data)
          
          if (data.conversation && data.conversation.messages) {
            setConversationId(data.conversation.id)
            
            // Convertir les messages de l'API au format local
            const apiMessages = data.conversation.messages.map((msg: any) => ({
              id: msg.id,
              text: msg.content,
              sender: msg.senderId === session?.user?.email ? 'user' : 'bot',
              timestamp: new Date(msg.createdAt)
            }))
            
            setMessages(apiMessages)
            console.log('✅ [CHAT] Messages convertis:', apiMessages.length)
          }
        } else {
          console.log('⚠️ [CHAT] Erreur API:', response.status)
        }
      } catch (error) {
        console.error('❌ [CHAT] Erreur lors du chargement des messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (storefrontId) {
      loadMessages()
    }
  }, [storefrontId, session?.user?.email])

  // Mise à jour automatique des messages toutes les 3 secondes
  useEffect(() => {
    if (storefrontId && conversationId) {
      const interval = setInterval(async () => {
        try {
          console.log('🔄 [CHAT] Mise à jour automatique des messages...')
          
          // Récupérer les messages depuis l'API
          const response = await fetch(`/api/messages?storefrontId=${storefrontId}`)
          if (response.ok) {
            const data = await response.json()
            
            if (data.conversation && data.conversation.messages) {
              // Convertir les messages de l'API au format local
              const apiMessages = data.conversation.messages.map((msg: any) => ({
                id: msg.id,
                text: msg.content,
                sender: msg.senderId === session?.user?.email ? 'user' : 'bot',
                timestamp: new Date(msg.createdAt)
              }))
              
              // Mettre à jour seulement si il y a de nouveaux messages
              if (apiMessages.length > messages.length) {
                console.log('✅ [CHAT] Nouveaux messages détectés:', apiMessages.length - messages.length)
                setMessages(apiMessages)
              }
            }
          }
        } catch (error) {
          console.log('⚠️ [CHAT] Mise à jour silencieuse échouée:', error)
        }
      }, 3000) // Vérification toutes les 3 secondes
      
      return () => clearInterval(interval)
    }
  }, [storefrontId, conversationId, messages.length, session?.user?.email])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !session?.user?.email) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    // Ajouter le message immédiatement à l'interface
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      console.log('📤 [CHAT] Envoi du message:', inputValue.trim())
      
      // Envoyer le message via l'API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storefrontId,
          content: inputValue.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ [CHAT] Message envoyé avec succès:', data)
        
        if (!conversationId && data.message?.conversationId) {
          setConversationId(data.message.conversationId)
        }
        
        // Remplacer le message temporaire par le vrai message de l'API
        if (data.message) {
          setMessages(prev => prev.map(msg => 
            msg.id === userMessage.id 
              ? { ...msg, id: data.message.id }
              : msg
          ))
        }
      } else {
        console.error('❌ [CHAT] Erreur lors de l\'envoi:', response.status)
      }
    } catch (error) {
      console.error('❌ [CHAT] Erreur lors de l\'envoi du message:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.sender === 'bot' && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {message.sender === 'user' && (
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
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        {!session?.user?.email ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-2">Connectez-vous pour discuter</p>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Se connecter
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={handleVoiceInput}
                disabled={isTyping}
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
                disabled={!inputValue.trim() || isTyping}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Réponse garantie sous 24h
            </p>
          </>
        )}
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, Send, Upload, Calendar, Users, MapPin, DollarSign, MessageSquare, Mail } from "lucide-react"
import { useToast } from '@/hooks/useToast'
import { useSocket } from '@/hooks/useSocket'

type Message = {
  id: string
  sender: 'client' | 'partner'
  content: string
  date: string
  read: boolean
}

type QuoteRequest = {
  id: string
  status: string
  eventDate: string
  guestCount: string
  eventType: string
  venueLocation: string
  budget: string
  message: string | null
  customerEmail: string
  customerName: string
}

type Conversation = {
  id: string
  client: {
    name: string
    avatar: string
    type: string
  }
  messages: Message[]
  lastMessage: string
  date: string
  unread: boolean
  quoteRequest: QuoteRequest
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  // Socket.IO
  const { 
    socket, 
    isConnected, 
    joinConversation, 
    leaveConversation, 
    sendMessage, 
    onNewMessage, 
    onError 
  } = useSocket()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fonction pour récupérer les messages
  const fetchMessages = async () => {
    try {
      console.log('🔄 Chargement des messages partenaire...')
      const response = await fetch('/api/partner-dashboard/messages')
      console.log('📡 Réponse API:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Données reçues:', data)
        console.log('💬 Conversations:', data.conversations?.length || 0)
        
        if (data.conversations) {
          setConversations(data.conversations)
          console.log('✅ Conversations mises à jour:', data.conversations.length)
        } else {
          console.log('⚠️ Aucune conversation dans la réponse')
        }
      } else {
        console.error('❌ Erreur API:', response.status, response.statusText)
        toast({
          title: "Erreur",
          description: "Impossible de charger les messages",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Charger les messages au montage
  useEffect(() => {
    fetchMessages()
  }, [])

  // Écouter les nouveaux messages via Socket.IO
  useEffect(() => {
    const unsubscribe = onNewMessage((message) => {
      console.log('💬 Nouveau message reçu côté partenaire:', message)
      
      // Mettre à jour la conversation sélectionnée
      if (selectedConversation?.id === message.conversationId) {
        const newMessage: Message = {
          id: message.id, // Utiliser directement l'ID string
          sender: message.senderType === 'user' ? 'client' : 'partner',
          content: message.content,
          date: message.createdAt,
          read: true
        }
        
        setSelectedConversation(prev => {
          if (!prev) return null
          return {
            ...prev,
            messages: [...prev.messages, newMessage]
          }
        })
        
        // Scroll vers le dernier message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
      
      // Mettre à jour la liste des conversations
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message.content,
              date: message.createdAt
            }
          }
          return conv
        })
      })
    })

    return unsubscribe
  }, [onNewMessage, selectedConversation])

  // Écouter les erreurs Socket.IO
  useEffect(() => {
    const unsubscribe = onError((error) => {
      console.error('❌ Erreur Socket.IO côté partenaire:', error)
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      })
    })

    return unsubscribe
  }, [onError, toast])

  // Rejoindre/quitter les conversations via Socket.IO
  useEffect(() => {
    if (selectedConversation?.id && isConnected) {
      console.log('🔄 Rejoindre conversation Socket.IO:', selectedConversation.id)
      joinConversation(selectedConversation.id)
      
      return () => {
        console.log('🔄 Quitter conversation Socket.IO:', selectedConversation.id)
        leaveConversation(selectedConversation.id)
      }
    }
  }, [selectedConversation?.id, isConnected, joinConversation, leaveConversation])

  // Scroll automatique vers le bas quand les messages changent
  useEffect(() => {
    if (selectedConversation?.messages && selectedConversation.messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [selectedConversation?.messages])

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !isConnected) return

    try {
      // Envoyer le message via Socket.IO
      sendMessage(
        selectedConversation.id, 
        newMessage.trim(), 
        'provider',
        'Adeline Déco', // Nom du partenaire
        'partner@monmariage.ai' // Email du partenaire
      )
      
      // Vider le champ de saisie immédiatement
      setNewMessage('')
      
      console.log('💬 Message envoyé via Socket.IO côté partenaire')
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      })
    }
  }

  const handleSelectConversation = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      try {
        // Charger les messages de cette conversation
        const response = await fetch(`/api/partner-dashboard/messages?conversationId=${conversationId}`)
        if (response.ok) {
          const messages = await response.json()
          
          // Transformer les messages pour correspondre au format attendu
          const formattedMessages: Message[] = messages.map((msg: any) => ({
            id: msg.id, // Utiliser directement l'ID string de MongoDB
            sender: msg.senderType === 'user' ? 'client' : 'partner',
            content: msg.content,
            date: msg.createdAt,
            read: !!msg.readAt
          }))
          
          // Mettre à jour la conversation avec les messages
          const updatedConversation = {
            ...conversation,
            messages: formattedMessages
          }
          
          setSelectedConversation(updatedConversation)
          
          // Scroll vers le dernier message après sélection
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 300) // Délai plus long pour s'assurer que le DOM est rendu
        } else {
          console.error('Error loading conversation messages')
        }
      } catch (error) {
        console.error('Error loading conversation messages:', error)
      }
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.client.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto h-[calc(100vh-9rem)]">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Messages</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des messages...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-9rem)]">
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
      <div className="flex items-center space-x-2">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isConnected ? 'Connecté' : 'Déconnecté'}
        </span>
      </div>
    </div>
      
      <Card className="h-full flex overflow-hidden">
        {/* Liste des conversations */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Aucune demande de devis
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Les demandes de devis apparaîtront ici
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                    }`}
                  >
                    <Avatar>
                      <AvatarImage src={conversation.client.avatar} />
                      <AvatarFallback>{conversation.client.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.client.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(conversation.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                        {conversation.client.type}
                      </p>
                    </div>
                    {conversation.unread && (
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
                <Avatar>
                  <AvatarImage src={selectedConversation.client.avatar} />
                  <AvatarFallback>{selectedConversation.client.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedConversation.client.name}
                  </h2>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {selectedConversation.client.type}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Détails de la demande de devis */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Détails de la demande</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedConversation.quoteRequest.eventDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedConversation.quoteRequest.guestCount}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedConversation.quoteRequest.venueLocation || 'Non spécifié'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedConversation.quoteRequest.budget || 'Non spécifié'}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {selectedConversation.quoteRequest.customerEmail}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${message.sender === 'partner' ? 'items-end' : 'items-start'}`}
                  >
                    {/* Heure au-dessus du message */}
                    <p className="text-xs text-gray-500 mb-1 px-2">
                      {new Date(message.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    {/* Message */}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'partner'
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {/* Point de référence pour le scroll automatique */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form
                className="flex space-x-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
              >
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1"
                />
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                  <Button
                    type="submit"
                    size="icon"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Send className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Sélectionnez une conversation
              </h3>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
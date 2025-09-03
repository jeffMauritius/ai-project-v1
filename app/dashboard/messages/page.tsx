'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/useToast'

type Message = {
  id: string
  content: string
  senderId: string
  isOwn: boolean
  sender: {
    id: string
    name: string
    avatar: string
  }
  createdAt: string
  read: boolean
}

type Conversation = {
  id: string
  otherUser: {
    id: string
    name: string
    avatar: string
    type: string
  }
  lastMessage: string
  date: string
  unread: boolean
  messageCount: number
}

type ConversationDetail = {
  id: string
  client: {
    id: string
    name: string
    email: string
    image: string
  }
  partner: {
    id: string
    name: string
    email: string
    image: string
  }
  messages: Message[]
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const { toast } = useToast()

  // Récupérer les conversations
  useEffect(() => {
    fetchConversations()
  }, [])

  // Rechargement automatique des messages de la conversation sélectionnée
  useEffect(() => {
    if (selectedConversation && selectedConversation.id) {
      const interval = setInterval(async () => {
        try {
          // Récupérer seulement les nouveaux messages sans recharger toute la conversation
          const response = await fetch(`/api/messages/${selectedConversation.id}`)
          if (response.ok) {
            const data = await response.json()
            
            // Mettre à jour seulement les messages si il y en a de nouveaux
            if (data.messages && data.messages.length > selectedConversation.messages.length) {
              setSelectedConversation(prev => prev ? {
                ...prev,
                messages: data.messages
              } : null)
              
              // Mettre à jour aussi la liste des conversations pour le dernier message
              setConversations(prev => prev.map(conv =>
                conv.id === selectedConversation.id
                  ? {
                      ...conv,
                      lastMessage: data.messages[data.messages.length - 1]?.content || conv.lastMessage,
                      date: data.messages[data.messages.length - 1]?.createdAt || conv.date,
                      unread: true
                    }
                  : conv
              ))
            }
          }
        } catch (error) {
          console.log('Mise à jour silencieuse des messages échouée:', error)
        }
      }, 3000) // Vérification toutes les 3 secondes
      
      return () => clearInterval(interval)
    }
  }, [selectedConversation, conversations])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      } else {
        // Utiliser des données mockées en cas d'erreur
        setConversations([
          {
            id: '1',
            otherUser: {
              id: '1',
              name: 'Château de Vaux-le-Vicomte',
              avatar: 'https://images.unsplash.com/photo-1464808322410-1a934aab61e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
              type: 'Lieu'
            },
            lastMessage: 'Nous serions ravis de vous accueillir pour une visite...',
            date: '2024-01-15T10:30:00',
            unread: true,
            messageCount: 3
          },
          {
            id: '2',
            otherUser: {
              id: '2',
              name: 'Studio Lumière',
              avatar: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
              type: 'Photographe'
            },
            lastMessage: 'Je vous propose un rendez-vous le 20 janvier à 14h...',
            date: '2024-01-14T16:45:00',
            unread: false,
            messageCount: 5
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      // Utiliser des données mockées en cas d'erreur
      setConversations([
        {
          id: '1',
          otherUser: {
            id: '1',
      name: 'Château de Vaux-le-Vicomte',
      avatar: 'https://images.unsplash.com/photo-1464808322410-1a934aab61e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
      type: 'Lieu'
    },
    lastMessage: 'Nous serions ravis de vous accueillir pour une visite...',
    date: '2024-01-15T10:30:00',
          unread: true,
          messageCount: 3
  },
  {
          id: '2',
          otherUser: {
            id: '2',
      name: 'Studio Lumière',
      avatar: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
      type: 'Photographe'
    },
    lastMessage: 'Je vous propose un rendez-vous le 20 janvier à 14h...',
    date: '2024-01-14T16:45:00',
          unread: false,
          messageCount: 5
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleConversationSelect = async (conversation: Conversation) => {
    try {
      console.log('🔍 [DASHBOARD] Sélection de conversation:', conversation.id)
      
      const response = await fetch(`/api/messages/${conversation.id}`)
      if (response.ok) {
        const data = await response.json()
        
        // Construire l'objet selectedConversation avec l'ID de la conversation
        const conversationDetail: ConversationDetail = {
          id: conversation.id, // Utiliser l'ID de la conversation sélectionnée
          client: conversation.otherUser.type === 'Client' ? {
            id: conversation.otherUser.id,
            name: conversation.otherUser.name,
            email: '',
            image: conversation.otherUser.avatar
          } : {
            id: 'current-user',
            name: 'Vous',
            email: '',
            image: '/placeholder-venue.jpg'
          },
          partner: conversation.otherUser.type === 'Partenaire' ? {
            id: conversation.otherUser.id,
            name: conversation.otherUser.name,
            email: '',
            image: conversation.otherUser.avatar
          } : {
            id: 'current-user',
            name: 'Vous',
            email: '',
            image: '/placeholder-venue.jpg'
          },
          messages: data.messages || []
        }
        
        console.log('✅ [DASHBOARD] Conversation construite:', conversationDetail)
        setSelectedConversation(conversationDetail)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger la conversation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger la conversation",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sendingMessage) return

    console.log('🔍 [DASHBOARD] Envoi du message:')
    console.log('  - selectedConversation:', selectedConversation)
    console.log('  - selectedConversation.id:', selectedConversation?.id)
    console.log('  - newMessage:', newMessage.trim())

    try {
      setSendingMessage(true)
      
      const requestBody = {
        conversationId: selectedConversation.id,
        content: newMessage.trim()
      }
      
      console.log('📤 [DASHBOARD] Body de la requête:', requestBody)
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        
        // Ajouter le nouveau message à la conversation
        const newMsg: Message = {
          id: data.message.id,
          content: newMessage.trim(),
          senderId: data.message.senderId,
          isOwn: true,
          sender: {
            id: data.message.senderId,
            name: 'Vous',
            avatar: '/placeholder-venue.jpg'
          },
          createdAt: data.message.createdAt,
          read: false
        }

        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMsg]
        } : null)

        // Mettre à jour la liste des conversations
        setConversations(prev => prev.map(conv =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: newMessage.trim(),
                date: new Date().toISOString(),
                unread: false,
                messageCount: conv.messageCount + 1
              }
            : conv
        ))

        setNewMessage('')
        
        toast({
          title: "Message envoyé",
          description: "Votre message a été envoyé avec succès !",
        })
      } else {
        throw new Error('Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.otherUser.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto h-[calc(100vh-9rem)]">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Messages</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des conversations...</p>
          </div>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Aucune conversation
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Les conversations apparaîtront ici
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                  className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                  }`}
                >
                  <Image
                      src={conversation.otherUser.avatar}
                      alt={conversation.otherUser.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.otherUser.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(conversation.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                        {conversation.otherUser.type}
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
                <Image
                  src={selectedConversation.partner?.image || selectedConversation.client?.image || '/placeholder-venue.jpg'}
                  alt={selectedConversation.partner?.name || selectedConversation.client?.name || 'Utilisateur'}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedConversation.partner?.name || selectedConversation.client?.name || 'Utilisateur'}
                  </h2>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {selectedConversation.partner ? 'Partenaire' : 'Client'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Messages de la conversation */}
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-lg p-3 max-w-md ${
                        message.isOwn
                          ? 'bg-pink-50 dark:bg-pink-900/20'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                    <p className="text-sm text-gray-900 dark:text-white">
                        {message.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                ))}
                {sendingMessage && (
                <div className="flex justify-end">
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 max-w-md">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                        <span className="text-sm text-gray-900 dark:text-white">Envoi en cours...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form className="flex space-x-4" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
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
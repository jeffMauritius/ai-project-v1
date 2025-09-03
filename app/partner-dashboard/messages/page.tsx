'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/useToast'

type Message = {
  id: number
  sender: 'client' | 'partner'
  content: string
  date: string
  read: boolean
}

type Conversation = {
  id: string
  client: {
    name: string
    avatar: string
    type: string
  }
  lastMessage: string
  date: string
  unread: boolean
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Récupérer les conversations
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/partner-dashboard/messages')
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations)
        } else {
          // Utiliser des données mockées en cas d'erreur
          setConversations([
            {
              id: '1',
              client: {
                name: 'Sophie Martin',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
                type: 'Mariage'
              },
              lastMessage: 'Bonjour, je souhaiterais avoir plus d\'informations sur vos prestations...',
              date: '2024-01-15T10:30:00',
              unread: true
            },
            {
              id: '2',
              client: {
                name: 'Pierre Dubois',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
                type: 'Anniversaire'
              },
              lastMessage: 'Merci pour votre réponse, c\'est parfait !',
              date: '2024-01-14T16:45:00',
              unread: false
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
        // Utiliser des données mockées en cas d'erreur
        setConversations([
          {
            id: '1',
            client: {
              name: 'Sophie Martin',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
              type: 'Mariage'
            },
            lastMessage: 'Bonjour, je souhaiterais avoir plus d\'informations sur vos prestations...',
            date: '2024-01-15T10:30:00',
            unread: true
          },
          {
            id: '2',
            client: {
              name: 'Pierre Dubois',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
              type: 'Anniversaire'
            },
            lastMessage: 'Merci pour votre réponse, c\'est parfait !',
            date: '2024-01-14T16:45:00',
            unread: false
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [toast])

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return

    try {
      // Envoyer le message via l'API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        // Mettre à jour la conversation localement
        setConversations(conversations.map(conv =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: newMessage,
                date: new Date().toISOString(),
                unread: false
              }
            : conv
        ))

        setNewMessage('')
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      })
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.client.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto h-[calc(100vh-9rem)]">
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
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                    }`}
                  >
                    <Image
                      src={conversation.client.avatar || '/placeholder-venue.jpg'}
                      alt={conversation.client.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
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
                <Image
                  src={selectedConversation.client.avatar || '/placeholder-venue.jpg'}
                  alt={selectedConversation.client.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
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
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Messages de la conversation */}
              <div className="space-y-4">
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-md">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Bonjour, je souhaiterais avoir plus d'informations sur vos prestations.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      10:30
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 max-w-md">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Bien sûr ! Je serais ravi(e) de vous renseigner. Quelles sont vos dates ?
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      10:32
                    </p>
                  </div>
                </div>
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
                />
                <button
                  type="submit"
                  onClick={handleSendMessage}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
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
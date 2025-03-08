'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, MicrophoneIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'

type Message = {
  id: number
  sender: 'client' | 'partner'
  content: string
  date: string
  read: boolean
}

type Conversation = {
  id: number
  client: {
    name: string
    avatar: string
    type: string
  }
  messages: Message[]
  lastMessage: string
  date: string
  unread: boolean
}

const mockConversations: Conversation[] = [
  {
    id: 1,
    client: {
      name: 'Sophie Martin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
      type: 'Mariage Juillet 2024'
    },
    messages: [
      {
        id: 1,
        sender: 'client',
        content: 'Bonjour, je souhaiterais avoir plus d\'informations sur vos prestations.',
        date: '2024-01-15T10:30:00',
        read: true
      },
      {
        id: 2,
        sender: 'partner',
        content: 'Bonjour Sophie ! Je serai ravi de vous renseigner. Quel type de prestation recherchez-vous ?',
        date: '2024-01-15T10:35:00',
        read: true
      },
      {
        id: 3,
        sender: 'client',
        content: 'Nous organisons notre mariage pour juillet 2024 avec environ 150 invités.',
        date: '2024-01-15T10:40:00',
        read: false
      }
    ],
    lastMessage: 'Nous organisons notre mariage pour juillet 2024...',
    date: '2024-01-15T10:40:00',
    unread: true
  },
  {
    id: 2,
    client: {
      name: 'Pierre Dubois',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
      type: 'Mariage Septembre 2024'
    },
    messages: [
      {
        id: 1,
        sender: 'client',
        content: 'Êtes-vous disponible le 14 septembre 2024 ?',
        date: '2024-01-14T15:20:00',
        read: true
      },
      {
        id: 2,
        sender: 'partner',
        content: 'Oui, cette date est encore disponible ! Souhaitez-vous organiser un rendez-vous ?',
        date: '2024-01-14T15:30:00',
        read: true
      }
    ],
    lastMessage: 'Oui, cette date est encore disponible !',
    date: '2024-01-14T15:30:00',
    unread: false
  }
]

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return

    const message: Message = {
      id: Math.max(0, ...selectedConversation.messages.map(m => m.id)) + 1,
      sender: 'partner',
      content: newMessage,
      date: new Date().toISOString(),
      read: true
    }

    setConversations(conversations.map(conv =>
      conv.id === selectedConversation.id
        ? {
            ...conv,
            messages: [...conv.messages, message],
            lastMessage: newMessage,
            date: message.date
          }
        : conv
    ))

    setNewMessage('')
  }

  const filteredConversations = conversations.filter(conv =>
    conv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.client.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-9rem)]">
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
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                  }`}
                >
                  <Image
                    src={conversation.client.avatar}
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
              ))}
            </div>
          </div>
        </div>

        {/* Zone de conversation */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Image
                  src={selectedConversation.client.avatar}
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
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'partner' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-lg p-3 max-w-md ${
                        message.sender === 'partner'
                          ? 'bg-pink-50 dark:bg-pink-900/20'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <p className="text-sm text-gray-900 dark:text-white">
                        {message.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(message.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
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
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <DocumentPlusIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    className="p-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
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
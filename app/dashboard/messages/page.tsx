'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

const mockConversations = [
  {
    id: 1,
    partner: {
      name: 'Château de Vaux-le-Vicomte',
      avatar: 'https://images.unsplash.com/photo-1464808322410-1a934aab61e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
      type: 'Lieu'
    },
    lastMessage: 'Nous serions ravis de vous accueillir pour une visite...',
    date: '2024-01-15T10:30:00',
    unread: true
  },
  {
    id: 2,
    partner: {
      name: 'Studio Lumière',
      avatar: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80',
      type: 'Photographe'
    },
    lastMessage: 'Je vous propose un rendez-vous le 20 janvier à 14h...',
    date: '2024-01-14T16:45:00',
    unread: false
  }
]

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState('')

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
              {mockConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedConversation === conversation.id ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                  }`}
                >
                  <Image
                    src={conversation.partner.avatar}
                    alt={conversation.partner.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conversation.partner.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(conversation.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                      {conversation.partner.type}
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
                  src={mockConversations.find(c => c.id === selectedConversation)?.partner.avatar || ''}
                  alt="Partner"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {mockConversations.find(c => c.id === selectedConversation)?.partner.name}
                  </h2>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {mockConversations.find(c => c.id === selectedConversation)?.partner.type}
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
                      Bonjour, je souhaiterais avoir plus d&apos;informations sur vos prestations.
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
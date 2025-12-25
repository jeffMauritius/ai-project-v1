'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/hooks/useSocket'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingConversation, setIsDeletingConversation] = useState<string | null>(null)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  
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

  // Charger les conversations au montage
  useEffect(() => {
    if (session?.user?.id) {
      loadConversations()
    }
  }, [session?.user?.id])

  // Écouter les nouveaux messages via Socket.IO
  useEffect(() => {
    const unsubscribe = onNewMessage((message) => {
      console.log('💬 Nouveau message reçu côté utilisateur:', message)
      
      // Mettre à jour les messages de la conversation sélectionnée
      if (selectedConversation === message.conversationId) {
        const newMessage: Message = {
          id: message.id,
          content: message.content,
          senderType: message.senderType,
          senderName: message.senderName,
          messageType: 'text',
          createdAt: message.createdAt
        }
        
        setMessages(prev => [...prev, newMessage])
        
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
              lastMessage: {
                content: message.content,
                timestamp: message.createdAt,
                senderType: message.senderType
              },
              updatedAt: message.createdAt
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
      console.error('❌ Erreur Socket.IO côté utilisateur:', error)
    })

    return unsubscribe
  }, [onError])

  // Rejoindre/quitter les conversations via Socket.IO
  useEffect(() => {
    if (selectedConversation && isConnected) {
      console.log('🔄 Rejoindre conversation Socket.IO:', selectedConversation)
      joinConversation(selectedConversation)
      
      return () => {
        console.log('🔄 Quitter conversation Socket.IO:', selectedConversation)
        leaveConversation(selectedConversation)
      }
    }
  }, [selectedConversation, isConnected, joinConversation, leaveConversation])

  // Scroll automatique vers le bas quand les messages changent
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages])

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
        
        // Scroll vers le dernier message après chargement
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 300) // Délai plus long pour s'assurer que le DOM est rendu
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)
  }

  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher la sélection de la conversation
    setConversationToDelete(conversationId)
  }

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return

    setIsDeletingConversation(conversationToDelete)
    const conversationId = conversationToDelete
    setConversationToDelete(null)
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Supprimer la conversation de la liste
        setConversations(prev => prev.filter(c => c.id !== conversationId))

        // Si la conversation supprimée était sélectionnée, désélectionner
        if (selectedConversation === conversationId) {
          setSelectedConversation(null)
          setMessages([])
        }
      } else {
        const errorData = await response.json()
        console.error('Erreur lors de la suppression:', errorData)
        alert('Erreur lors de la suppression de la conversation')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression de la conversation')
    } finally {
      setIsDeletingConversation(null)
    }
  }


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !isConnected) return

    try {
      // Envoyer le message via Socket.IO
      sendMessage(
        selectedConversation, 
        newMessage.trim(), 
        'user',
        session?.user?.name || session?.user?.email || 'Utilisateur',
        session?.user?.email || ''
      )
      
      // Vider le champ de saisie immédiatement
      setNewMessage('')
      
      console.log('💬 Message envoyé via Socket.IO côté utilisateur')
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
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
    <div className="flex items-center justify-between mb-4 sm:mb-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
      <div className="flex items-center space-x-2">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {isConnected ? 'Connecté' : 'Déconnecté'}
        </span>
      </div>
    </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col md:flex-row overflow-hidden">
        {/* Liste des conversations */}
        <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700`}>
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
                  <div
                    key={conversation.id}
                    className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group ${
                      selectedConversation === conversation.id ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                    }`}
                    onClick={() => handleSelectConversation(conversation.id)}
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
                    <div className="flex items-center space-x-2">
                      {conversation.unreadCount.user > 0 && (
                        <span className="h-2 w-2 bg-pink-600 rounded-full"></span>
                      )}
                      <button
                        onClick={(e) => handleDeleteClick(conversation.id, e)}
                        disabled={isDeletingConversation === conversation.id}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Supprimer la conversation"
                      >
                        {isDeletingConversation === conversation.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Zone de conversation */}
        {selectedConversation ? (
          <div className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-1 flex flex-col w-full md:w-2/3`}>
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {/* Bouton retour sur mobile */}
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Retour aux conversations"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-pink-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">
                    {conversations.find(c => c.id === selectedConversation)?.partner.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-pink-600 dark:text-pink-400">
                    {conversations.find(c => c.id === selectedConversation)?.partner.type}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    isConnected
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    <span className="hidden sm:inline">{isConnected ? 'En ligne' : 'Hors ligne'}</span>
                    <span className="sm:hidden">{isConnected ? '●' : '○'}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4" ref={messagesEndRef}>
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
                {/* Point de référence pour le scroll automatique */}
                <div ref={messagesEndRef} />
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

      {/* Modal de confirmation de suppression */}
      <AlertDialog open={!!conversationToDelete} onOpenChange={(open) => !open && setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible et tous les messages seront perdus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
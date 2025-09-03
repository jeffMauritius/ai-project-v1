'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon, StarIcon, MapPinIcon, MicrophoneIcon, DocumentPlusIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/useToast'
import { useSession } from 'next-auth/react'

type Partner = {
  id: string
  title: string
  description: string
  location: string
  rating: number
  price: string
  images: string[]
  partnerId?: string // ID réel du partenaire en base de données
}

export default function PartnerDetail({ id }: { id: string }) {
  const { data: session } = useSession()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [chatMessage, setChatMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{
    id: number
    type: 'partner' | 'user'
    content: string
    timestamp: string
  }>>([])
  const { toast } = useToast()

  // Récupérer les informations du partenaire
  useEffect(() => {
    const fetchPartner = async () => {
      try {
        // Essayer de récupérer depuis l'API d'abord
        const response = await fetch(`/api/partner-storefront`)
        if (response.ok) {
          const data = await response.json()
          // Si c'est le partenaire connecté, utiliser ses données
          if (data.partner && data.partner.companyName) {
            setPartner({
              id: id,
              title: data.partner.companyName,
              description: data.partner.description || 'Description non disponible',
              location: `${data.partner.billingCity || 'Ville'}, ${data.partner.billingCountry || 'Pays'}`,
              rating: 4.5,
              price: 'Sur devis',
              images: [
                'https://images.unsplash.com/photo-1464808322410-1a934aab61e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80',
                'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80'
              ],
              partnerId: data.id // ID du storefront
            })
            return
          }
        }
      } catch (error) {
        console.log('Pas de partenaire connecté, utilisation des données mockées')
      }

      // Fallback vers les données mockées
      const mockPartners: Record<string, Partner> = {
        "1": {
          id: "1",
          title: "Château de Vaux-le-Vicomte",
          description: "Un château majestueux du XVIIe siècle entouré de jardins à la française, parfait pour des mariages de prestige.",
          location: "Maincy, Île-de-France",
          rating: 4.9,
          price: "À partir de 15 000€",
          images: [
            "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80",
            "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80",
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80"
          ]
        },
        "2": {
          id: "2",
          title: "Studio Lumière",
          description: "Studio photo professionnel spécialisé dans la photographie de mariage et d'événements.",
          location: "Paris, Île-de-France",
          rating: 4.8,
          price: "À partir de 800€",
          images: [
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80",
            "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80"
          ]
        },
        "mona-ilsa": {
          id: "mona-ilsa",
          title: "Mona Ilsa",
          description: "Lisa est passionnée par la création de moments inoubliables. Dès son plus jeune âge, elle a été attirée par le dessin, le design et la création. Après des études artistiques, son mariage en 2014 a été une révélation qui l'a conduite vers la décoration d'événements. Aujourd'hui Wedding & Event Designer, elle croit que chaque événement est unique et s'efforce de personnaliser chaque concept. La décoration et l'organisation sont deux services distincts proposés par l'entreprise.",
          location: "Liège, France",
          rating: 4.5,
          price: "Sur devis",
          images: [
            "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80",
            "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80",
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=800&q=80"
          ],
          partnerId: "68b54449a15c57f76264a4e2@monmariage.ai" // ID réel de Mona Ilsa
        }
      }

      const mockPartner = mockPartners[id]
      if (mockPartner) {
        setPartner(mockPartner)
        // Initialiser le chat avec le message de bienvenue
        setChatHistory([
          {
            id: 1,
            type: 'partner' as const,
            content: `Bonjour ! Je suis l'assistant virtuel de ${mockPartner.title}. Comment puis-je vous aider à planifier votre événement ?`,
            timestamp: '10:00'
          }
        ])
      }
    }

    fetchPartner()
  }, [id])
  
  if (!partner) {
    return <div>Partenaire non trouvé</div>
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % partner.images.length)
  }
  
  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + partner.images.length) % partner.images.length)
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isSending) return

    // Vérifier que l'utilisateur est connecté
    if (!session?.user?.email) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour envoyer un message",
        variant: "destructive",
      })
      return
    }

    const userMessage = {
      id: Date.now(),
      type: 'user' as const,
      content: chatMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Ajouter le message de l'utilisateur au chat
    setChatHistory(prev => [...prev, userMessage])
    setChatMessage('')
    setIsSending(true)

    try {
      // Envoyer le message via l'API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storefrontId: partner.partnerId || partner.id,
          content: userMessage.content
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Ajouter une réponse automatique du partenaire
        const partnerResponse = {
          id: Date.now() + 1,
          type: 'partner' as const,
          content: `Merci pour votre message ! L'équipe de ${partner.title} vous répondra dans les plus brefs délais. En attendant, vous pouvez consulter nos disponibilités ou demander un devis personnalisé.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setChatHistory(prev => [...prev, partnerResponse])

        toast({
          title: "Message envoyé",
          description: "Votre message a été envoyé avec succès ! Il apparaîtra dans votre dashboard de messagerie.",
        })

        // Rediriger vers le dashboard après un délai
        setTimeout(() => {
          window.location.href = '/dashboard/messages'
        }, 2000)
      } else {
        throw new Error('Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      
      // Ajouter une réponse d'erreur
      const errorResponse = {
        id: Date.now() + 1,
        type: 'partner' as const,
        content: 'Désolé, une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setChatHistory(prev => [...prev, errorResponse])

      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            {/* Gallery */}
            <div className="relative h-[600px] mb-8 group">
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentImageIndex}
                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ 
                    duration: 0.5,
                    ease: "easeInOut"
                  }}>
                  <Image
                    src={partner.images[currentImageIndex]}
                    alt={`${partner.title} - Vue ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            
              <div className="absolute inset-0 z-10 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={previousImage}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </div>
            
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {partner.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-[600px] mb-8 flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-lg p-4 max-w-md ${
                        message.type === 'user'
                          ? 'bg-pink-50 dark:bg-pink-900/20'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                  <p className="text-gray-600 dark:text-gray-300">
                        {message.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {message.timestamp}
                  </p>
                </div>
                </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Envoi en cours...</span>
                      </div>
                    </div>
                </div>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={session?.user ? "Posez vos questions..." : "Connectez-vous pour poser vos questions..."}
                  className="block w-full rounded-xl border-0 py-4 pl-4 pr-32 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500/50 resize-none disabled:opacity-50"
                  rows={3}
                  disabled={isSending || !session?.user}
                />
                <div className="absolute right-2 bottom-2 flex gap-2">
                  <button 
                    type="button"
                    className="p-2 rounded-lg text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    aria-label="Commande vocale"
                    disabled={isSending || !session?.user}
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                  </button>
                  <button 
                    type="button"
                    className="p-2 rounded-lg text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    aria-label="Ajouter un fichier"
                    disabled={isSending || !session?.user}
                  >
                    <DocumentPlusIcon className="h-5 w-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || isSending || !session?.user}
                    className="p-2 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperAirplaneIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Réponse garantie sous 24h
                </p>
                {!session?.user && (
                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                    Connectez-vous pour envoyer un message
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Partner Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 lg:col-span-5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{partner.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {partner.location}
                  </div>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    {partner.rating}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{partner.price}</div>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {partner.description}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
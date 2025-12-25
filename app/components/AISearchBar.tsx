'use client'

import { Mic, Send, Upload, MicOff, Loader2, ArrowRight } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useToast } from '@/hooks/useToast'
import { useSession } from 'next-auth/react'

export default function AISearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [animatingTag, setAnimatingTag] = useState<{ text: string, rect: DOMRect } | null>(null)
  const [mounted, setMounted] = useState(false)
  
  const { toast } = useToast()
  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useSpeechRecognition()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mettre à jour la requête quand la transcription change
  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript)
    }
  }, [transcript])

  // Afficher les erreurs de reconnaissance vocale
  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur de reconnaissance vocale",
        description: error,
        variant: "destructive"
      })
    }
  }, [error, toast])

  if (!mounted) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérifier l'authentification
    if (!session?.user?.id) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour utiliser la recherche IA.",
        variant: "destructive"
      })
      return
    }
    
    if (searchQuery.trim()) {
      setIsSearching(true)
      
      try {
        // Effectuer la recherche IA
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            filters: {}
          }),
        })

        if (!response.ok) {
          throw new Error('Erreur lors de la recherche')
        }

        const data = await response.json()
        
        console.log('📱 Données reçues côté client:', {
          total: data.total,
          resultsCount: data.results?.length || 0,
          criteria: data.criteria,
          firstResult: data.results?.[0] ? {
            id: data.results[0].id,
            companyName: data.results[0].companyName,
            serviceType: data.results[0].serviceType
          } : 'Aucun résultat'
        })
        

        
        // Stocker les résultats dans sessionStorage avec limitation de taille
        try {
          // Limiter les résultats à 50 éléments pour éviter le dépassement de quota
          const limitedResults = data.results.slice(0, 50)
          const limitedCriteria = {
            ...data.criteria,
            totalResults: data.results.length // Garder le total original
          }
          
          sessionStorage.setItem('searchResults', JSON.stringify(limitedResults))
          sessionStorage.setItem('searchCriteria', JSON.stringify(limitedCriteria))
        } catch (storageError) {
          console.warn('Impossible de stocker les résultats dans sessionStorage:', storageError)
          // En cas d'erreur, on continue sans stocker les résultats
        }
        
        // Rediriger vers les résultats avec seulement la requête
        router.push(`/results?q=${encodeURIComponent(searchQuery)}`)
      } catch (error) {
        console.error('Erreur de recherche:', error)
        toast({
          title: "Erreur de recherche",
          description: "Impossible d'effectuer la recherche. Veuillez réessayer.",
          variant: "destructive"
        })
      } finally {
        setIsSearching(false)
      }
    }
  }

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening()
      resetTranscript()
    } else {
      startListening()
    }
  }

  const handleTagClick = async (text: string, e: React.MouseEvent) => {
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const textareaRect = textareaRef.current?.getBoundingClientRect()
    
    if (!textareaRect) return
    
    setAnimatingTag({ 
      text,
      rect: buttonRect
    })
    
    // Retarder et animer l'apparition du texte caractère par caractère
    let currentText = ''
    const chars = text.split('')
    
    // Attendre que l'animation du tag commence
    setTimeout(() => {
      const interval = setInterval(() => {
        if (currentText.length < chars.length) {
          currentText += chars[currentText.length]
          setSearchQuery(currentText)
        } else {
          clearInterval(interval)
        }
      }, 50) // 50ms entre chaque caractère
    }, 800) // Attendre 800ms avant de commencer
    
    setTimeout(() => {
      setAnimatingTag(null)
      textareaRef.current?.focus()
    }, 2500)
  }

  // Si l'utilisateur n'est pas connecté, afficher la carte d'authentification
  if (status === 'loading') {
    return (
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user?.id) {
    return (
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Recherche IA
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Pour utiliser cette fonctionnalité, vous devez créer un compte gratuit.
            </p>
            <Button
              onClick={() => router.push('/auth/register')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium mx-auto"
            >
              Créer un compte gratuitement
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl">
      <form className="relative flex items-center" onSubmit={handleSubmit}>
        <Textarea
          ref={textareaRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-h-[80px] resize-none rounded-xl pl-6 pr-32 py-6 text-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] focus-visible:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow border-0 focus-visible:ring-1 focus-visible:ring-pink-500/30 dark:focus-visible:ring-pink-500/20 dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] dark:focus-visible:shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
          placeholder="Décrivez ce que vous recherchez..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <div className="absolute right-16 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Commande vocale"
            onClick={handleVoiceInput}
            disabled={!isSupported}
            className={`transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                : 'hover:bg-pink-50 dark:hover:bg-pink-900/20'
            }`}
          >
            {isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Ajouter un fichier"
          >
            <Upload className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="default"
          size="icon"
          type="submit" 
          className="absolute right-4"
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
      
      {/* Indicateur de reconnaissance vocale */}
      {isListening && (
        <div className="mt-2 flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span>Écoute en cours... (arrêt automatique après 2s d&apos;inactivité)</span>
        </div>
      )}

      {pathname === '/' && <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
        <div className="flex flex-wrap gap-2 pb-2">
          {[
            { text: "Château avec jardin près de Paris", delay: 0 },
            { text: "Photographe style reportage", delay: 0.1 },
            { text: "Traiteur cuisine française", delay: 0.2 },
            { text: "Salle de réception champêtre", delay: 0.3 },
            { text: "DJ ambiance lounge", delay: 0.4 },
            { text: "Fleuriste bouquet bohème", delay: 0.5 },
            { text: "Wedding planner bilingue", delay: 0.6 },
            { text: "Robe de mariée sur mesure", delay: 0.7 },
            { text: "Domaine viticole Bordeaux", delay: 0.8 },
            { text: "Orchestre jazz manouche", delay: 0.9 },
            { text: "Décorateur thème champêtre", delay: 1.0 },
            { text: "Voiture collection mariage", delay: 1.1 },
            { text: "Maquilleur professionnel", delay: 1.2 },
            { text: "Lieu insolite Paris", delay: 1.3 }
          ].map(({ text, delay }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.5 }}
            >
              <motion.button
                onClick={(e) => handleTagClick(text, e)}
                className="flex-shrink-0 rounded-full bg-gray-50/50 dark:bg-gray-800 px-4 py-2 hover:bg-pink-50 dark:hover:bg-gray-700 hover:text-pink-600 dark:hover:text-pink-400 transition-colors text-xs relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  style={{
                    display: 'inline-block',
                    willChange: 'transform'
                  }}
                  animate={animatingTag?.text === text ? {
                    y: [0, -100, -50],
                    x: [0, 50, 100],
                    scale: [1, 1.5, 0.8],
                    opacity: [1, 1, 0],
                    rotate: [0, -10, -20],
                  } : undefined}
                  transition={{
                    duration: 2,
                    ease: [0.19, 1, 0.22, 1]
                  }}
                >
                  {text}
                </motion.span>
                {animatingTag?.text === text && (
                  <motion.span
                    className="absolute left-0 top-0 w-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.5], y: -20 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  >
                    ✨
                  </motion.span>
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>}
    </div>
  )
}
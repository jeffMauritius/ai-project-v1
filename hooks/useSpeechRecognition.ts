import { useState, useCallback, useEffect, useRef } from 'react'

// Types pour l'API Web Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  transcript: string
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const absoluteTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour démarrer le timeout d'inactivité
  const startInactivityTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      console.log('🎤 Timeout précédent annulé')
    }
    
    console.log('🎤 Nouveau timeout démarré (2 secondes)')
    timeoutRef.current = setTimeout(() => {
      if (recognition && isListening) {
        console.log('🎤 Arrêt automatique du microphone après 2 secondes d\'inactivité')
        recognition.stop()
      }
    }, 2000) // 2 secondes pour forcer l'arrêt
  }, [recognition, isListening])

  // Fonction pour démarrer le timeout absolu (maximum 10 secondes)
  const startAbsoluteTimeout = useCallback(() => {
    if (absoluteTimeoutRef.current) {
      clearTimeout(absoluteTimeoutRef.current)
    }
    
    console.log('🎤 Timeout absolu démarré (5 secondes maximum)')
    absoluteTimeoutRef.current = setTimeout(() => {
      if (recognition && isListening) {
        console.log('🎤 Arrêt automatique du microphone après 5 secondes maximum')
        recognition.stop()
      }
    }, 5000) // 5 secondes maximum
  }, [recognition, isListening])

  // Fonction pour démarrer la vérification périodique
  const startPeriodicCheck = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
    }
    
    console.log('🎤 Vérification périodique démarrée (toutes les 1 seconde)')
    checkIntervalRef.current = setInterval(() => {
      if (recognition && isListening) {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current
        console.log(`🎤 Temps depuis dernière activité: ${timeSinceLastActivity}ms`)
        
        if (timeSinceLastActivity > 3000) { // 3 secondes d'inactivité
          console.log('🎤 Arrêt automatique du microphone par vérification périodique')
          recognition.stop()
        }
      }
    }, 1000) // Vérifier toutes les 1 seconde
  }, [recognition, isListening])

  // Fonction pour démarrer le timeout de sécurité (3 secondes quoi qu'il arrive)
  const startSafetyTimeout = useCallback(() => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
    }
    
    console.log('🎤 Timeout de sécurité démarré (3 secondes quoi qu\'il arrive)')
    safetyTimeoutRef.current = setTimeout(() => {
      if (recognition && isListening) {
        console.log('🎤 ARRÊT FORCÉ du microphone par timeout de sécurité')
        setIsListening(false) // Forcer l'arrêt de l'état
        try {
          recognition.stop()
        } catch (e) {
          console.log('🎤 Erreur lors de l\'arrêt forcé:', e)
        }
      }
    }, 3000) // 3 secondes quoi qu'il arrive
  }, [recognition, isListening])

  // Fonction pour arrêter tous les timeouts
  const clearInactivityTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      console.log('🎤 Timeout d\'inactivité arrêté')
    }
    if (absoluteTimeoutRef.current) {
      clearTimeout(absoluteTimeoutRef.current)
      absoluteTimeoutRef.current = null
      console.log('🎤 Timeout absolu arrêté')
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
      console.log('🎤 Vérification périodique arrêtée')
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = null
      console.log('🎤 Timeout de sécurité arrêté')
    }
  }, [])

  useEffect(() => {
    // Vérifier si l'API est supportée
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognitionInstance = new SpeechRecognition()
        
        // Configuration pour le français
        recognitionInstance.lang = 'fr-FR'
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.maxAlternatives = 1
        
        // Événements
        recognitionInstance.onstart = () => {
          console.log('🎤 Reconnaissance vocale démarrée')
          setIsListening(true)
          setError(null)
          lastActivityRef.current = Date.now()
          startAbsoluteTimeout() // Démarrer le timeout absolu
          startInactivityTimeout() // Démarrer le timeout d'inactivité
          startPeriodicCheck() // Démarrer la vérification périodique
          startSafetyTimeout() // Démarrer le timeout de sécurité
        }
        
        recognitionInstance.onend = () => {
          console.log('🎤 Reconnaissance vocale arrêtée')
          setIsListening(false)
          clearInactivityTimeout() // Arrêter le timeout
        }
        
        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          const currentTranscript = finalTranscript || interimTranscript
          const previousTranscript = transcript
          
          setTranscript(currentTranscript)
          
          // Seulement réinitialiser le timeout si le texte a vraiment changé
          if (currentTranscript !== previousTranscript && currentTranscript.trim().length > 0) {
            console.log('🎤 Nouveau texte détecté, réinitialisation du timeout')
            lastActivityRef.current = Date.now()
            startInactivityTimeout()
          } else {
            console.log('🎤 Résultat identique, pas de réinitialisation du timeout')
          }
        }
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          clearInactivityTimeout() // Arrêter le timeout en cas d'erreur
          
          switch (event.error) {
            case 'no-speech':
              setError('Aucune parole détectée. Veuillez parler plus fort.')
              break
            case 'audio-capture':
              setError('Erreur de capture audio. Vérifiez votre microphone.')
              break
            case 'not-allowed':
              setError('Permission refusée pour l\'accès au microphone.')
              break
            case 'network':
              setError('Erreur réseau. Vérifiez votre connexion.')
              break
            default:
              setError('Erreur de reconnaissance vocale.')
          }
        }
        
        setRecognition(recognitionInstance)
      } else {
        setIsSupported(false)
        setError('La reconnaissance vocale n\'est pas supportée par votre navigateur.')
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognition && isSupported) {
      try {
        recognition.start()
      } catch (error) {
        console.error('Erreur lors du démarrage de la reconnaissance vocale:', error)
        setError('Impossible de démarrer la reconnaissance vocale.')
        clearInactivityTimeout() // Arrêter le timeout en cas d'erreur
      }
    }
  }, [recognition, isSupported, clearInactivityTimeout])

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop()
      clearInactivityTimeout() // Arrêter le timeout
    }
  }, [recognition, isListening, clearInactivityTimeout])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (recognition && isListening) {
        recognition.stop()
      }
      clearInactivityTimeout() // Arrêter le timeout
    }
  }, [recognition, isListening, clearInactivityTimeout])

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error
  }
} 
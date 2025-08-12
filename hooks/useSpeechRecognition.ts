import { useState, useCallback, useEffect } from 'react'

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
          setIsListening(true)
          setError(null)
        }
        
        recognitionInstance.onend = () => {
          setIsListening(false)
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
          
          setTranscript(finalTranscript || interimTranscript)
        }
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          
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
      }
    }
  }, [recognition, isSupported])

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop()
    }
  }, [recognition, isListening])

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
    }
  }, [recognition, isListening])

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
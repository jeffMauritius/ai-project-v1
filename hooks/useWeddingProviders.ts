import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export type WeddingProvider = {
  id: string
  name: string
  type: string
  date: string // Format français dd/mm/yyyy
  status: 'confirmed' | 'pending' | 'cancelled'
  price: string
  deposit: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ProviderFormData = Omit<WeddingProvider, 'id' | 'createdAt' | 'updatedAt'>

export function useWeddingProviders() {
  const { data: session, status } = useSession()
  const [providers, setProviders] = useState<WeddingProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les prestataires seulement quand la session est disponible
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    if (status === 'unauthenticated') {
      setLoading(false)
      setError('Non authentifié')
      return
    }

    if (session?.user?.id) {
      fetchProviders()
    }
  }, [session?.user?.id, status])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching providers for user:', session?.user?.id)
      
      const response = await fetch('/api/wedding-providers', {
        credentials: 'include', // Important pour inclure les cookies de session
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Erreur lors du chargement des prestataires')
      }
      
      const data = await response.json()
      console.log('Providers loaded:', data)
      setProviders(data)
    } catch (err) {
      console.error('Erreur fetchProviders:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const addProvider = async (providerData: ProviderFormData): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch('/api/wedding-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(providerData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du prestataire')
      }
      
      const newProvider = await response.json()
      setProviders(prev => [newProvider, ...prev])
      return true
    } catch (err) {
      console.error('Erreur addProvider:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      return false
    }
  }

  const deleteProvider = async (id: string): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/wedding-providers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(errorData.error || 'Erreur lors de la suppression du prestataire')
      }
      
      setProviders(prev => prev.filter(p => p.id !== id))
      return true
    } catch (err) {
      console.error('Erreur deleteProvider:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      return false
    }
  }

  const updateProvider = async (id: string, providerData: ProviderFormData): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/wedding-providers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(providerData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du prestataire')
      }
      
      const updatedProvider = await response.json()
      setProviders(prev => prev.map(p => p.id === id ? updatedProvider : p))
      return true
    } catch (err) {
      console.error('Erreur updateProvider:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      return false
    }
  }

  return {
    providers,
    loading,
    error,
    addProvider,
    deleteProvider,
    updateProvider,
    refetch: fetchProviders
  }
}

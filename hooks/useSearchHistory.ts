import { useState, useEffect } from 'react'
import { useToast } from './useToast'

export interface SearchHistoryItem {
  id: string
  date: string
  type: string
  query: string
  results: Array<{
    name: string
    status: string
  }>
}

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Charger l'historique des recherches
  const fetchSearchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/search-history')
      
      if (response.ok) {
        const data = await response.json()
        setSearchHistory(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger l'historique des recherches",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Sauvegarder une nouvelle recherche
  const saveSearch = async (query: string, type: string, results: any[] = []) => {
    try {
      const response = await fetch('/api/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          type,
          results: results.slice(0, 5).map((result: any) => ({
            name: result.companyName || result.name || 'Résultat',
            status: 'Consulté'
          }))
        }),
      })

      if (response.ok) {
        // Recharger l'historique pour afficher la nouvelle recherche
        await fetchSearchHistory()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      // Ne pas afficher d'erreur à l'utilisateur car c'est une fonctionnalité secondaire
    }
  }

  // Supprimer une recherche
  const deleteSearch = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/search-history/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSearchHistory(prev => prev.filter(item => item.id !== id))
        toast({
          title: "Succès",
          description: "Recherche supprimée de l'historique"
        })
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la recherche",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    } finally {
      setDeletingId(null)
    }
  }

  // Charger l'historique au montage du composant
  useEffect(() => {
    fetchSearchHistory()
  }, [])

  return {
    searchHistory,
    loading,
    deletingId,
    fetchSearchHistory,
    saveSearch,
    deleteSearch
  }
} 
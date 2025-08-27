import { useState, useEffect } from 'react'
import { useToast } from './useToast'

export interface ConsultedStorefront {
  id: string
  storefrontId: string
  name: string
  type: string
  serviceType?: string
  status: string
  createdAt: string
  updatedAt: string
}

export function useConsultedStorefronts() {
  const [consultedStorefronts, setConsultedStorefronts] = useState<ConsultedStorefront[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Charger les vitrines consultées
  const fetchConsultedStorefronts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/consulted-storefronts')
      
      if (response.ok) {
        const data = await response.json()
        setConsultedStorefronts(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les vitrines consultées",
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

  // Marquer une vitrine comme consultée
  const markAsConsulted = async (storefrontId: string, name: string, type: string, serviceType?: string) => {
    try {
      const response = await fetch('/api/consulted-storefronts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storefrontId,
          name,
          type,
          serviceType
        }),
      })

      if (response.ok) {
        // Recharger la liste pour afficher la nouvelle consultation
        await fetchConsultedStorefronts()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      // Ne pas afficher d'erreur à l'utilisateur car c'est une fonctionnalité secondaire
    }
  }

  // Supprimer une consultation
  const deleteConsultation = async (id: string) => {
    try {
      const response = await fetch(`/api/consulted-storefronts/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConsultedStorefronts(prev => prev.filter(item => item.id !== id))
        toast({
          title: "Succès",
          description: "Vitrine supprimée de l'historique"
        })
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la vitrine",
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
    }
  }

  // Charger les vitrines consultées au montage du composant
  useEffect(() => {
    fetchConsultedStorefronts()
  }, [])

  return {
    consultedStorefronts,
    loading,
    fetchConsultedStorefronts,
    markAsConsulted,
    deleteConsultation,
    refreshList: fetchConsultedStorefronts
  }
} 
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from './useToast'

export interface GuestGroup {
  id: string
  name: string
  type: 'family' | 'friends' | 'colleagues' | 'other'
  count: number
  confirmed: boolean
  notes: string
  createdAt: string
  updatedAt: string
  guests: Guest[]
}

export interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  groupId: string
  status: 'pending' | 'confirmed' | 'declined'
  createdAt: string
  updatedAt: string
  group?: {
    id: string
    name: string
    type: string
  }
}

export function useGuests() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([])
  const [individualGuests, setIndividualGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Charger les données depuis MongoDB
  const fetchGuestGroups = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/guests')
      
      if (response.ok) {
        const data = await response.json()
        setGuestGroups(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les groupes d'invités",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchIndividualGuests = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/individual-guests')
      
      if (response.ok) {
        const data = await response.json()
        setIndividualGuests(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les invités individuels",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des invités individuels:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    }
  }

  // Créer un nouveau groupe d'invités
  const createGuestGroup = async (groupData: Omit<GuestGroup, 'id' | 'createdAt' | 'updatedAt' | 'guests'>) => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      })

      if (response.ok) {
        const newGroup = await response.json()
        setGuestGroups(prev => [newGroup, ...prev])
        toast({
          title: "Succès",
          description: "Groupe d'invités créé avec succès"
        })
        return newGroup
      } else {
        const error = await response.text()
        toast({
          title: "Erreur",
          description: error || "Impossible de créer le groupe",
          variant: "destructive"
        })
        return null
      }
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  // Mettre à jour un groupe d'invités
  const updateGuestGroup = async (id: string, groupData: Partial<GuestGroup>) => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const response = await fetch(`/api/guests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      })

      if (response.ok) {
        const updatedGroup = await response.json()
        setGuestGroups(prev => prev.map(group => 
          group.id === id ? updatedGroup : group
        ))
        toast({
          title: "Succès",
          description: "Groupe d'invités mis à jour"
        })
        return updatedGroup
      } else {
        const error = await response.text()
        toast({
          title: "Erreur",
          description: error || "Impossible de mettre à jour le groupe",
          variant: "destructive"
        })
        return null
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du groupe:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  // Supprimer un groupe d'invités
  const deleteGuestGroup = async (id: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/guests/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setGuestGroups(prev => prev.filter(group => group.id !== id))
        // Supprimer aussi les invités individuels de ce groupe
        setIndividualGuests(prev => prev.filter(guest => guest.groupId !== id))
        toast({
          title: "Succès",
          description: "Groupe d'invités supprimé"
        })
        return true
      } else {
        const error = await response.text()
        toast({
          title: "Erreur",
          description: error || "Impossible de supprimer le groupe",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
      return false
    }
  }

  // Créer un nouvel invité individuel
  const createIndividualGuest = async (guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt' | 'group'>) => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const response = await fetch('/api/individual-guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guestData),
      })

      if (response.ok) {
        const newGuest = await response.json()
        setIndividualGuests(prev => [newGuest, ...prev])
        toast({
          title: "Succès",
          description: "Invité ajouté avec succès"
        })
        return newGuest
      } else {
        const error = await response.text()
        toast({
          title: "Erreur",
          description: error || "Impossible d'ajouter l'invité",
          variant: "destructive"
        })
        return null
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'invité:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  // Mettre à jour un invité individuel
  const updateIndividualGuest = async (id: string, guestData: Partial<Guest>) => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const response = await fetch(`/api/individual-guests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guestData),
      })

      if (response.ok) {
        const updatedGuest = await response.json()
        setIndividualGuests(prev => prev.map(guest => 
          guest.id === id ? updatedGuest : guest
        ))
        toast({
          title: "Succès",
          description: "Invité mis à jour"
        })
        return updatedGuest
      } else {
        const error = await response.text()
        toast({
          title: "Erreur",
          description: error || "Impossible de mettre à jour l'invité",
          variant: "destructive"
        })
        return null
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'invité:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  // Supprimer un invité individuel
  const deleteIndividualGuest = async (id: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/individual-guests/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIndividualGuests(prev => prev.filter(guest => guest.id !== id))
        toast({
          title: "Succès",
          description: "Invité supprimé"
        })
        return true
      } else {
        const error = await response.text()
        toast({
          title: "Erreur",
          description: error || "Impossible de supprimer l'invité",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'invité:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
      return false
    }
  }

  // Charger les données au montage du composant
  useEffect(() => {
    if (session?.user?.id) {
      fetchGuestGroups()
      fetchIndividualGuests()
    }
  }, [session?.user?.id])

  return {
    guestGroups,
    individualGuests,
    loading,
    saving,
    createGuestGroup,
    updateGuestGroup,
    deleteGuestGroup,
    createIndividualGuest,
    updateIndividualGuest,
    deleteIndividualGuest,
    fetchGuestGroups,
    fetchIndividualGuests
  }
} 
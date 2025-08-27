import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from './useToast'

export interface Table {
  id: string
  name: string
  seats: number
  guests: string[]
  createdAt: string
  updatedAt: string
}

export function useTables() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Charger les tables depuis MongoDB
  const fetchTables = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/tables')
      
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les tables",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tables:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Créer une nouvelle table
  const createTable = async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'guests'>) => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tableData),
      })

      if (response.ok) {
        const newTable = await response.json()
        setTables(prev => [newTable, ...prev])
        toast({
          title: "Succès",
          description: "Table ajoutée avec succès"
        })
        return newTable
      } else {
        const error = await response.text()
        toast({
          title: "Erreur",
          description: error || "Impossible d'ajouter la table",
          variant: "destructive"
        })
        return null
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la table:', error)
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

  // Mettre à jour une table
  const updateTable = async (id: string, tableData: Partial<Table>) => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const response = await fetch(`/api/tables/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tableData),
      })

      if (response.ok) {
        const updatedTable = await response.json()
        setTables(prev => prev.map(table => 
          table.id === id ? updatedTable : table
        ))
        toast({
          title: "Succès",
          description: "Table mise à jour"
        })
        return updatedTable
      } else {
        const error = await response.text()
        toast({
          title: "Erreur",
          description: error || "Impossible de mettre à jour la table",
          variant: "destructive"
        })
        return null
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la table:', error)
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

  // Supprimer une table
  const deleteTable = async (id: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/tables/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTables(prev => prev.filter(table => table.id !== id))
        toast({
          title: "Succès",
          description: "Table supprimée"
        })
        return true
      } else {
        const error = await response.text()
        toast({
          title: "Erreur",
          description: error || "Impossible de supprimer la table",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la table:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
      return false
    }
  }

  // Vérifier si une table peut être supprimée
  const canDeleteTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId)
    return table ? table.guests.length === 0 : true
  }

  // Ajouter un invité à une table
  const addGuestToTable = async (tableId: string, guestName: string) => {
    if (!session?.user?.id) return

    try {
      const table = tables.find(t => t.id === tableId)
      if (!table) return false

      const updatedGuests = [...table.guests, guestName]
      const success = await updateTable(tableId, { guests: updatedGuests })
      
      if (success) {
        // Rafraîchir les données après mise à jour
        await fetchTables()
      }
      
      return Boolean(success)
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'invité à la table:', error)
      return false
    }
  }

  // Retirer un invité d'une table
  const removeGuestFromTable = async (tableId: string, guestName: string) => {
    if (!session?.user?.id) return

    try {
      const table = tables.find(t => t.id === tableId)
      if (!table) return false

      const updatedGuests = table.guests.filter(g => g !== guestName)
      const success = await updateTable(tableId, { guests: updatedGuests })
      
      if (success) {
        // Rafraîchir les données après mise à jour
        await fetchTables()
      }
      
      return Boolean(success)
    } catch (error) {
      console.error('Erreur lors du retrait de l\'invité de la table:', error)
      return false
    }
  }

  // Charger les données au montage du composant
  useEffect(() => {
    if (session?.user?.id) {
      fetchTables()
    }
  }, [session?.user?.id])

  return {
    tables,
    loading,
    saving,
    createTable,
    updateTable,
    deleteTable,
    canDeleteTable,
    addGuestToTable,
    removeGuestFromTable,
    fetchTables
  }
} 
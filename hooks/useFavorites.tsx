'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Favorite {
  id: string
  storefrontId: string
  name: string
  location: string
  rating: number
  numberOfReviews: number
  description: string
  imageUrl: string
  createdAt: string
}

interface FavoritesContextType {
  favorites: Favorite[]
  isLoading: boolean
  isFavorite: (storefrontId: string) => boolean
  addFavorite: (favorite: Omit<Favorite, 'id' | 'createdAt'>) => Promise<boolean>
  removeFavorite: (storefrontId: string) => Promise<boolean>
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Charger les favoris une seule fois au montage
  const loadFavorites = useCallback(async () => {
    if (!session?.user || isLoading) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        setFavorites(data)
        setIsInitialized(true)
      } else {
        console.error('Erreur lors du chargement des favoris')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user, isLoading])

  // Charger les favoris au montage et quand la session change
  useEffect(() => {
    if (session?.user && !isInitialized) {
      loadFavorites()
    } else if (!session?.user) {
      setFavorites([])
      setIsInitialized(false)
    }
  }, [session?.user, loadFavorites, isInitialized])

  // Vérifier si un élément est en favori
  const isFavorite = useCallback((storefrontId: string): boolean => {
    return favorites.some(fav => fav.storefrontId === storefrontId)
  }, [favorites])

  // Ajouter un favori
  const addFavorite = useCallback(async (favorite: Omit<Favorite, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!session?.user) return false

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(favorite),
      })

      if (response.ok) {
        const newFavorite = await response.json()
        setFavorites(prev => [newFavorite, ...prev])
        return true
      } else {
        console.error('Erreur lors de l\'ajout du favori')
        return false
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du favori:', error)
      return false
    }
  }, [session?.user])

  // Supprimer un favori
  const removeFavorite = useCallback(async (storefrontId: string): Promise<boolean> => {
    if (!session?.user) return false

    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storefrontId }),
      })

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.storefrontId !== storefrontId))
        return true
      } else {
        console.error('Erreur lors de la suppression du favori')
        return false
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error)
      return false
    }
  }, [session?.user])

  // Rafraîchir les favoris
  const refreshFavorites = useCallback(async () => {
    await loadFavorites()
  }, [loadFavorites])

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
    refreshFavorites,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HeartIcon, MapPinIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

// Type pour un favori
interface Favorite {
  id: string
  storefrontId: string
  name: string
  location: string
  rating: number
  numberOfReviews: number
  description: string
  imageUrl?: string
  createdAt: string
}

export default function Favorites() {
  const router = useRouter()
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Charger les favoris au montage du composant
  useEffect(() => {
    if (session?.user) {
      loadFavorites()
    }
  }, [session])

  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        setFavorites(data)
      } else {
        console.error('Erreur lors du chargement des favoris')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFavorite = async (storefrontId: string, name: string) => {
    try {
      const response = await fetch(`/api/favorites?storefrontId=${storefrontId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Mettre à jour la liste locale
        setFavorites(prev => prev.filter(fav => fav.storefrontId !== storefrontId))
        
        // Mettre à jour le statut de la vitrine consultée
        try {
          console.log('[FAVORITES_PAGE] Mise à jour du statut - action: remove, storefrontId:', storefrontId)
          const statusResponse = await fetch('/api/consulted-storefronts/update-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storefrontId,
              name,
              action: 'remove'
            }),
          });
          console.log('[FAVORITES_PAGE] Réponse mise à jour statut:', statusResponse.status, statusResponse.ok)
        } catch (error) {
          console.error('Erreur lors de la mise à jour du statut:', error);
        }
      } else {
        console.error('Erreur lors de la suppression du favori')
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleViewDetails = (storefrontId: string) => {
    router.push(`/storefront/${storefrontId}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes favoris</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Retrouvez tous vos lieux et prestataires favoris
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes favoris</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Retrouvez tous vos lieux et prestataires favoris
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun favori pour le moment
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Commencez à explorer nos lieux et prestataires pour ajouter vos favoris
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <Card 
              key={favorite.id} 
              className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(favorite.storefrontId)}
            >
              <div className="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
                {/* Image de la vitrine */}
                {favorite.imageUrl && favorite.imageUrl !== '/placeholder-venue.jpg' ? (
                  <Image
                    src={favorite.imageUrl}
                    alt={favorite.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  /* Placeholder joli avec bannière rose */
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex items-center justify-center">
                    <div className="text-center">
                      <HeartIcon className="h-12 w-12 text-pink-300 dark:text-pink-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {favorite.name}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Badge "Favori" */}
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200">
                    <HeartIcon className="h-3 w-3 mr-1" />
                    Favori
                  </span>
                </div>
                
                {/* Bouton supprimer */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFavorite(favorite.storefrontId, favorite.name)
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {favorite.name}
                  </h3>
                  <div className="flex items-center text-sm">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="font-medium text-gray-900 dark:text-white">{favorite.rating}</span>
                    <span className="text-gray-500 dark:text-gray-400">/5</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1">({favorite.numberOfReviews})</span>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{favorite.location}</span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                  {favorite.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Ajouté le {new Date(favorite.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-pink-600 border-pink-200 hover:bg-pink-50 dark:text-pink-400 dark:border-pink-800 dark:hover:bg-pink-900/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(favorite.storefrontId)
                    }}
                  >
                    Voir détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 
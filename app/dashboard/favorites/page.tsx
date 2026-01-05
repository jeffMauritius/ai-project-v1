'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HeartIcon, MapPinIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useFavorites } from '@/hooks/useFavorites'

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
  const { favorites, isLoading, removeFavorite } = useFavorites()

  const handleRemoveFavorite = async (storefrontId: string, name: string) => {
    try {
      const success = await removeFavorite(storefrontId)
      
      if (success) {
        // Mettre à jour le statut de la vitrine consultée
        try {
          // Logique de mise à jour du statut si nécessaire
        } catch (updateError) {
          console.error('Erreur lors de la mise à jour:', updateError)
        }
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
        <div className="text-center py-12">
          <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun favori</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Commencez à ajouter des lieux et prestataires à vos favoris.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => router.push('/establishments')}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Découvrir les établissements
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <Card key={favorite.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full">
                <Image
                  src={favorite.imageUrl || '/placeholder-venue.jpg'}
                  alt={favorite.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/80 hover:bg-white/90 rounded-full"
                    onClick={() => handleRemoveFavorite(favorite.storefrontId, favorite.name)}
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {/* MASQUÉ TEMPORAIREMENT - Avis et étoiles */}
                    {/* <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{favorite.rating}</span>
                    <span className="text-xs text-gray-500">({favorite.numberOfReviews})</span> */}
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg mb-1 group-hover:text-pink-600 transition-colors">
                  {favorite.name}
                </h3>
                
                <div className="flex items-center gap-1 mb-2">
                  <MapPinIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{favorite.location}</span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {favorite.description.replace(/<[^>]*>/g, '')}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(favorite.storefrontId)}
                    className="flex-1"
                  >
                    Voir les détails
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
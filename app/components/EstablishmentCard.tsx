'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ZoomIn, ImageOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { useImageGallery } from '@/hooks/useImageGallery'

interface EstablishmentCardProps {
  establishment: {
    id: string
    name: string
    location: string
    rating: number
    numberOfReviews: number
    description: string
    priceRange: string
    capacity: string
    images: string[] // Tableau d'URLs Vercel Blob Storage
    imageUrl?: string // Champ optionnel pour compatibilité
  }
}

export default function EstablishmentCard({ establishment }: EstablishmentCardProps) {
  const [isNavigating, setIsNavigating] = useState(false)
  const [imageError, setImageError] = useState(false)

  const {
    id,
    name,
    location,
    rating,
    numberOfReviews,
    description,
    priceRange,
    capacity,
    images,
    imageUrl,
  } = establishment;

  // Utiliser le tableau images comme source principale (URLs Vercel Blob), avec imageUrl comme fallback
  const allImages = images && images.length > 0 ? images : (imageUrl ? [imageUrl] : []);
  const mainImage = allImages[0] || '/placeholder-venue.jpg';
  const hasValidImage = allImages.length > 0 && !imageError;

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])
  
  const { openGallery } = useImageGallery(
    allImages.map((url, index) => ({
      id: `card-img-${id}-${index}`,
      url,
      alt: `${name} - Image ${index + 1}`
    }))
  )

  const handleCardClick = async () => {
    if (isNavigating) return
    
    setIsNavigating(true)
    
    // Marquer l'établissement comme consulté (optionnel, ne bloque pas la navigation)
    try {
      const response = await fetch('/api/consulted-storefronts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storefrontId: id,
          name: name,
          type: 'VENUE',
          serviceType: 'Lieu de réception'
        }),
      })
      
      if (!response.ok) {
        // Si l'utilisateur n'est pas connecté, on ignore l'erreur
      }
    } catch (error) {
      // Ignorer les erreurs de réseau
    } finally {
      setIsNavigating(false)
    }
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
              <ImageOff className="w-12 h-12 mb-2" />
              <span className="text-sm">Image non disponible</span>
            </div>
          ) : (
            <Image
              src={mainImage}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
            />
          )}
          
          {/* Bouton de favori */}
          <div className="absolute top-4 right-4 z-10">
            <FavoriteButton 
              storefrontId={id}
              name={name}
              type="VENUE"
              serviceType="Lieu de réception"
            />
          </div>
          
          {/* Bouton galerie */}
          {hasValidImage && allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                openGallery(0);
              }}
              className="absolute left-4 bottom-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all z-10"
              aria-label="Voir la galerie"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          )}
          
          {hasValidImage && allImages.length > 0 && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              {allImages.slice(0, 5).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === 0 ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Link overlay for the entire image area */}
          <Link 
            href={`/storefront/${id}`} 
            onClick={handleCardClick}
            className="absolute inset-0 z-0"
            aria-label={`Voir les détails de ${name}`}
          />
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-lg font-semibold">⭐ {rating}</span>
            <span className="text-sm text-gray-600">
              ({numberOfReviews})
            </span>
            <span className="ml-2 text-sm text-gray-600">{location}</span>
          </div>
        </div>
        <h3 className="mb-2 text-xl font-semibold group-hover:text-pink-600 transition-colors">{name}</h3>
        <div 
          className="mb-4 text-sm text-gray-600 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: description }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {priceRange && priceRange !== "0" && priceRange !== "0€" && (
              <span className="text-sm font-semibold">À partir de {priceRange}</span>
            )}
            <span className="text-sm text-gray-600">{capacity}</span>
          </div>
          <Link href={`/storefront/${id}`} onClick={handleCardClick}>
            <Button variant="default" className="group-hover:bg-pink-600 transition-colors">
              Voir les détails
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ZoomIn } from 'lucide-react'
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
        console.log('Utilisateur non connecté, consultation non sauvegardée')
      }
    } catch (error) {
      // Ne pas bloquer la navigation si la sauvegarde échoue
      console.log('Erreur lors de la sauvegarde de la consultation (non bloquante):', error)
    }
    
    setIsNavigating(false)
  }

  return (
    <Card className="w-full overflow-hidden group">
      <div className="relative h-[200px] w-full">
        {/* Favorite Button - Outside the Link */}
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton
            storefrontId={id}
            name={name}
            location={location}
            rating={rating}
            numberOfReviews={numberOfReviews}
            description={description}
            imageUrl={mainImage}
            className="rounded-full bg-white/80 hover:bg-white/90"
            size="icon"
          />
        </div>
        
        {/* Image container with relative positioning */}
        <div className="relative h-full w-full">
          <div className="absolute left-4 top-4 z-10">
            <span className="rounded-md bg-amber-400 px-2 py-1 text-sm font-semibold">
              TOP
            </span>
          </div>
          <Image
            src={mainImage}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Bouton pour ouvrir la galerie */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                openGallery(0);
              }}
              className="absolute left-4 bottom-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all z-10"
              aria-label="Voir la galerie"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          )}
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
            <span className="text-sm font-semibold">À partir de {priceRange}</span>
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
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Media {
  id: string
  url: string
  type: string
  title: string | null
  description: string | null
  order: number
}

interface ImageCarouselProps {
  images: Media[]
  title: string
}

export default function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]))
  }

  const handleImageLoad = (imageUrl: string) => {
    // Image chargée avec succès
  }

  // Filtrer les images qui ont échoué
  const validImages = images.filter(img => !failedImages.has(img.url))
  
  // Si toutes les images ont échoué, réinitialiser l'état après un délai
  useEffect(() => {
    if (failedImages.size === images.length && images.length > 0) {
      const timer = setTimeout(() => {
        setFailedImages(new Set())
      }, 10000) // Réessayer après 10 secondes
      return () => clearTimeout(timer)
    }
  }, [failedImages.size, images.length])

  // Auto-rotation des images
  useEffect(() => {
    if (validImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [validImages.length])

  // Si toutes les images ont échoué, afficher un message informatif
  if (failedImages.size === images.length && images.length > 0) {
    return (
      <div className="relative h-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-gray-500 mb-2">Images temporairement indisponibles</p>
          <p className="text-sm text-gray-400">Réessai en cours...</p>
        </div>
      </div>
    )
  }

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? validImages.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === validImages.length - 1 ? 0 : currentIndex + 1)
  }

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex)
  }
  
  // Si toutes les images ont échoué ou qu'il n'y en a pas, utiliser l'image de fallback
  if (!images || images.length === 0 || validImages.length === 0) {
    return (
      <div className="relative h-full overflow-hidden rounded-lg">
        <Image
          src="/placeholder-venue.jpg"
          alt={`${title} - Image par défaut`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <p className="text-white text-lg font-medium">Image par défaut</p>
        </div>
      </div>
    )
  }

  // Vérifier qu'on a des images valides et que l'index est correct
  if (validImages.length === 0) {
    return (
      <div className="relative h-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Aucune image disponible</p>
      </div>
    )
  }

  // S'assurer que l'index est dans les limites
  const safeIndex = Math.min(currentIndex, validImages.length - 1)
  const currentImage = validImages[safeIndex]

  if (!currentImage) {
    return (
      <div className="relative h-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Erreur de chargement des images</p>
      </div>
    )
  }

  return (
    <div className="relative h-full overflow-hidden rounded-lg">
      {/* Image principale */}
      <div className="relative h-full">
        <Image
          src={currentImage.url}
          alt={currentImage.title || `${title} - Image ${safeIndex + 1}`}
          fill
          className="object-cover"
          onError={() => handleImageError(currentImage.url)}
          onLoad={() => handleImageLoad(currentImage.url)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          unoptimized={true}
        />
      </div>

      {/* Boutons de navigation */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
            aria-label="Image suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicateurs de points */}
      {validImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {validImages.map((_, slideIndex) => (
            <button
              key={slideIndex}
              onClick={() => goToSlide(slideIndex)}
              className={`w-3 h-3 rounded-full transition-all ${
                slideIndex === currentIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Aller à l'image ${slideIndex + 1}`}
            />
          ))}
        </div>
      )}

      {/* Compteur d'images */}
      {validImages.length > 1 && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {validImages.length}
        </div>
      )}
    </div>
  )
} 
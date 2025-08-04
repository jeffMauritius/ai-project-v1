'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Media {
  id: string
  url: string
  type: string
  title: string | null
  description: string | null
  order: number
}

interface ImageGalleryProps {
  images: Media[]
  title: string
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedImage === null) return

      switch (event.key) {
        case 'Escape':
          setSelectedImage(null)
          break
        case 'ArrowLeft':
          setSelectedImage(prev => prev !== null ? Math.max(0, prev - 1) : null)
          break
        case 'ArrowRight':
          setSelectedImage(prev => prev !== null ? Math.min(images.length - 1, prev + 1) : null)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, images.length])

  const goToPrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage(Math.max(0, selectedImage - 1))
    }
  }

  const goToNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(Math.min(images.length - 1, selectedImage + 1))
    }
  }

  if (!images || images.length === 0) {
    return null
  }

  return (
    <>
      {/* Galerie d'images */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Galerie photos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
              onClick={() => setSelectedImage(index)}
            >
              <Image
                src={image.url}
                alt={image.title || `${title} - Image ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                quality={80}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-venue.jpg'
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
            </div>
          ))}
        </div>
      </section>

      {/* Modal pour l'image sélectionnée */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full">
            {/* Image principale */}
            <div className="relative aspect-video">
              <Image
                src={images[selectedImage].url}
                alt={images[selectedImage].title || `${title} - Image ${selectedImage + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                quality={90}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-venue.jpg'
                }}
              />
            </div>

            {/* Bouton fermer */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Boutons de navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={selectedImage === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={selectedImage === images.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Compteur d'images */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                {selectedImage + 1} / {images.length}
              </div>
            )}

            {/* Titre de l'image */}
            {images[selectedImage].title && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg max-w-md">
                <h3 className="font-semibold">{images[selectedImage].title}</h3>
                {images[selectedImage].description && (
                  <p className="text-sm opacity-90 mt-1">{images[selectedImage].description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
} 
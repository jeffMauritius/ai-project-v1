'use client'

import { createContext, useContext, ReactNode, useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useImageGallery } from '@/hooks/useImageGallery'

interface ImageItem {
  id?: string
  url: string
  title?: string
  description?: string
  alt?: string
}

interface GalleryContextType {
  openGallery: (images: ImageItem[], startIndex?: number, onDelete?: (deletedId?: string) => void) => void
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined)

export function useGallery() {
  const context = useContext(GalleryContext)
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider')
  }
  return context
}

interface GalleryProviderProps {
  children: ReactNode
}

export function GalleryProvider({ children }: GalleryProviderProps) {
  const [galleryImages, setGalleryImages] = useState<ImageItem[]>([])
  const [onDeleteCb, setOnDeleteCb] = useState<((deletedId?: string) => void) | undefined>(undefined)
  const {
    isOpen,
    selectedImage,
    openGallery: openGalleryInternal,
    closeGallery,
    goToPrevious,
    goToNext,
    goToImage
  } = useImageGallery(galleryImages)

  const openGallery = (images: ImageItem[], startIndex: number = 0, onDelete?: (deletedId?: string) => void) => {
    setGalleryImages(images)
    setOnDeleteCb(() => onDelete)
    openGalleryInternal(startIndex)
  }

  const handleDelete = async () => {
    if (selectedImage === null) return
    const image = galleryImages[selectedImage]
    if (!image?.id) return

    const confirmed = window.confirm('Supprimer cette photo ?')
    if (!confirmed) return

    try {
      const res = await fetch(`/api/user/photos/${image.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Suppression échouée')

      const newImages = galleryImages.filter((_, idx) => idx !== selectedImage)
      setGalleryImages(newImages)

      // Ajuster l'index courant
      if (newImages.length === 0) {
        closeGallery()
      } else if (selectedImage >= newImages.length) {
        goToImage(newImages.length - 1)
      }

      // Notifier parent
      if (onDeleteCb) onDeleteCb(image.id)
    } catch (e) {
      console.error('[Gallery] Erreur de suppression', e)
      alert("Impossible de supprimer la photo.")
    }
  }

  return (
    <GalleryContext.Provider value={{ openGallery }}>
      {children}
      
      {/* Modal Lightbox Global */}
      {isOpen && selectedImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Image principale */}
            <div className="relative max-w-full max-h-full">
              <Image
                src={galleryImages[selectedImage].url}
                alt={galleryImages[selectedImage].alt || galleryImages[selectedImage].title || `Image ${selectedImage + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-[80vh] object-contain"
                quality={90}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-venue.jpg'
                }}
              />
            </div>

            {/* Bouton fermer */}
            <button
              onClick={closeGallery}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all z-10"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Bouton supprimer */}
            {galleryImages[selectedImage]?.id && (
              <button
                onClick={handleDelete}
                className="absolute top-4 left-4 bg-red-600 text-white p-3 rounded-full hover:bg-red-500 transition-all z-10"
                aria-label="Supprimer"
                title="Supprimer cette photo"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}

            {/* Boutons de navigation */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={selectedImage === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-75 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={selectedImage === galleryImages.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-75 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Compteur d'images */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full z-10">
                {selectedImage + 1} / {galleryImages.length}
              </div>
            )}

            {/* Titre et description de l'image */}
            {(galleryImages[selectedImage].title || galleryImages[selectedImage].description) && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg max-w-md z-10">
                {galleryImages[selectedImage].title && (
                  <h3 className="font-semibold">{galleryImages[selectedImage].title}</h3>
                )}
                {galleryImages[selectedImage].description && (
                  <p className="text-sm opacity-90 mt-1">{galleryImages[selectedImage].description}</p>
                )}
              </div>
            )}

            {/* Thumbnails en bas */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                {galleryImages.map((image, index) => (
                  <div
                    key={image.id || index}
                    className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      index === selectedImage ? 'border-white' : 'border-transparent hover:border-white/50'
                    }`}
                    onClick={() => goToImage(index)}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || image.title || `Thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </GalleryContext.Provider>
  )
} 
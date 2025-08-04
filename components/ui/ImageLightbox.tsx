'use client'

import Image from 'next/image'
import { ZoomIn } from 'lucide-react'
import { useGallery } from './GlobalImageGallery'

interface ImageItem {
  id?: string
  url: string
  title?: string
  description?: string
  alt?: string
}

interface ImageLightboxProps {
  images: ImageItem[]
  title?: string
  className?: string
  showThumbnails?: boolean
  thumbnailSize?: 'sm' | 'md' | 'lg'
  gridCols?: 2 | 3 | 4 | 5
}

export function ImageLightbox({ 
  images, 
  title = "Galerie photos",
  className = "",
  showThumbnails = true,
  thumbnailSize = 'md',
  gridCols = 4
}: ImageLightboxProps) {
  const { openGallery } = useGallery()

  if (!images || images.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Aucune image disponible</p>
      </div>
    )
  }

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  }[gridCols]

  const thumbnailSizeClass = {
    sm: 'aspect-square',
    md: 'aspect-square',
    lg: 'aspect-square'
  }[thumbnailSize]

  return (
    <section className={`mb-8 ${className}`}>
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      
      {showThumbnails ? (
        <div className={`grid ${gridColsClass} gap-4`}>
          {images.map((image, index) => (
            <div
              key={image.id || index}
              className={`relative ${thumbnailSizeClass} cursor-pointer group overflow-hidden rounded-lg bg-gray-100`}
              onClick={() => openGallery(images, index)}
            >
              <Image
                src={image.url}
                alt={image.alt || image.title || `Image ${index + 1}`}
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
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Affichage en carrousel simple
        <div className="relative h-80 overflow-hidden rounded-lg">
          <Image
            src={images[0].url}
            alt={images[0].alt || images[0].title || "Image principale"}
            fill
            className="object-cover cursor-pointer"
            onClick={() => openGallery(images, 0)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          />
          {images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                +{images.length - 1} autres images
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
} 
import { useState, useEffect } from 'react'

interface ImageItem {
  id?: string
  url: string
  title?: string
  description?: string
  alt?: string
}

export function useImageGallery(images: ImageItem[]) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          closeGallery()
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
  }, [isOpen, images.length])

  const openGallery = (index: number = 0) => {
    setSelectedImage(index)
    setIsOpen(true)
  }

  const closeGallery = () => {
    setIsOpen(false)
    setSelectedImage(null)
  }

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

  const goToImage = (index: number) => {
    setSelectedImage(index)
  }

  return {
    isOpen,
    selectedImage,
    openGallery,
    closeGallery,
    goToPrevious,
    goToNext,
    goToImage
  }
} 
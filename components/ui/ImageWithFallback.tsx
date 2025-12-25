'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'

interface ImageWithFallbackProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  fallbackClassName?: string
  fallbackText?: string
}

export function ImageWithFallback({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  fallbackClassName = '',
  fallbackText = 'Image non disponible'
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false)

  const handleError = useCallback(() => {
    setError(true)
  }, [])

  if (error || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${fallbackClassName}`}>
        <ImageOff className="w-12 h-12 mb-2" />
        <span className="text-sm text-center px-2">{fallbackText}</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  )
}

export default ImageWithFallback

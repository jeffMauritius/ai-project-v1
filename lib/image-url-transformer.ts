/**
 * Utilitaire pour transformer les URLs d'images de mariages.net vers Vercel Blob Storage
 */

/**
 * Transforme une URL d'image de mariages.net vers l'URL Vercel Blob correspondante
 * @param originalUrl - URL originale (mariages.net ou autre)
 * @returns URL transformée ou URL originale si pas de transformation nécessaire
 */
export function transformImageUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) {
    return '/placeholder-venue.jpg'
  }

  // Si l'URL est déjà sur Vercel Blob, la retourner telle quelle
  if (originalUrl.includes('blob.vercel-storage.com') || originalUrl.includes('vercel-storage.com')) {
    return originalUrl
  }

  // Si l'URL n'est pas de mariages.net, la retourner telle quelle
  if (!originalUrl.includes('mariages.net')) {
    return originalUrl
  }

  // Extraire l'ID de l'établissement ou du partenaire depuis l'URL
  // Les URLs mariages.net ont des patterns comme :
  // - https://cdn0.mariages.net/vendor/1106/3_2/320/jpeg/img-1628_3_301106-172182712321649.webp
  // - https://cdn0.mariages.net/vendor/7134/3_2/320/jpg/juliendage-561_3_157134-173263140638266.webp
  
  // Pour l'instant, on retourne l'URL originale car la transformation nécessite
  // de connaître l'ID de l'entité (establishment ou partner) pour construire
  // la nouvelle URL Vercel Blob
  return originalUrl
}

/**
 * Transforme un tableau d'URLs d'images
 * @param urls - Tableau d'URLs originales
 * @returns Tableau d'URLs transformées
 */
export function transformImageUrls(urls: (string | null | undefined)[]): string[] {
  return urls
    .map(url => transformImageUrl(url))
    .filter(url => url !== '/placeholder-venue.jpg') // Filtrer les placeholders
}

/**
 * Transforme une URL d'image avec l'ID de l'entité pour construire l'URL Vercel Blob
 * @param originalUrl - URL originale
 * @param entityId - ID de l'établissement ou du partenaire
 * @param category - 'establishments' ou 'partners'
 * @param imageIndex - Index de l'image (optionnel)
 * @returns URL transformée vers Vercel Blob
 */
export function transformImageUrlWithEntity(
  originalUrl: string | null | undefined,
  entityId: string,
  category: 'establishments' | 'partners',
  imageIndex?: number
): string {
  if (!originalUrl) {
    return '/placeholder-venue.jpg'
  }

  // Si l'URL est déjà sur Vercel Blob, la retourner telle quelle
  if (originalUrl.includes('blob.vercel-storage.com') || originalUrl.includes('vercel-storage.com')) {
    return originalUrl
  }

  // Si l'URL n'est pas de mariages.net, la retourner telle quelle
  if (!originalUrl.includes('mariages.net')) {
    return originalUrl
  }

  // Construire l'URL Vercel Blob
  // Format attendu: https://tngthgmxehdhwfq3.public.blob.vercel-storage.com/establishments/68b64e3dfe5f4fb71c6aa828/image-1-2D0DkIyskS4UUOwAOMRfus0YlMN6tZ.webp
  const baseUrl = 'https://tngthgmxehdhwfq3.public.blob.vercel-storage.com'
  const imageName = imageIndex !== undefined ? `image-${imageIndex}` : 'image-1'
  
  // Extraire l'extension du fichier original
  const extension = originalUrl.split('.').pop() || 'webp'
  
  // Construire l'URL finale
  const newUrl = `${baseUrl}/${category}/${entityId}/${imageName}.${extension}`
  
  return newUrl
}

/**
 * Transforme les URLs d'images d'un établissement
 * @param establishment - Objet établissement avec images
 * @returns Objet avec URLs transformées
 */
export function transformEstablishmentImages(establishment: any) {
  if (!establishment) return establishment

  const transformed = { ...establishment }

  // Les images sont maintenant migrées vers Vercel Blob Storage
  // Le champ images contient déjà les bonnes URLs Vercel
  // Pas besoin de transformation supplémentaire
  
  if (transformed.images && Array.isArray(transformed.images)) {
    transformed.images = transformed.images.map((url: string) => {
      // Les URLs sont déjà sur Vercel Blob Storage
      return url
    })
  }

  return transformed
}

/**
 * Transforme les URLs d'images d'un partenaire/storefront
 * @param partner - Objet partenaire avec images
 * @returns Objet avec URLs transformées
 */
export function transformPartnerImages(partner: any) {
  if (!partner) return partner

  const transformed = { ...partner }

  // Si l'imageUrl pointe vers mariages.net, utiliser la première image des médias
  if (transformed.imageUrl && transformed.imageUrl.includes('mariages.net')) {
    if (transformed.media && transformed.media.length > 0) {
      // Utiliser la première image des médias qui est déjà sur Vercel Blob
      const firstImage = transformed.media.find((m: any) => m.type === 'IMAGE')
      if (firstImage) {
        transformed.imageUrl = firstImage.url
      }
    } else if (transformed.images && transformed.images.length > 0) {
      // Sinon utiliser la première image du tableau images
      transformed.imageUrl = transformed.images[0]
    }
  }

  // Les médias du storefront contiennent déjà les bonnes URLs Vercel Blob, pas besoin de les transformer
  // Le tableau images contient aussi déjà les bonnes URLs Vercel Blob

  return transformed
}

'use client'

import Image from 'next/image'
import AISearchBar from '../components/AISearchBar'
import { PageNavigation } from '../components/PageNavigation'
import { StarIcon } from '@heroicons/react/24/solid'
import { MapPinIcon, BanknotesIcon, CalendarDaysIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'VENUE' | 'PARTNER'
  name: string
  companyName?: string
  description: string
  serviceType: string
  location?: string
  rating?: number
  price?: number
  capacity?: number
  images?: string[]
  imageUrl?: string
  logo?: string
  isActive?: boolean
  searchableOptions?: any
}

const ITEMS_PER_PAGE = 20
const INITIAL_LOAD = 20

export default function Results() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Récupérer la requête depuis l'URL
    const query = searchParams.get('q') || ''
    setSearchQuery(query)
    
    console.log('🔍 Page Results - Requête:', query)
    
    // Reset pour nouvelle recherche
    setSearchResults([])
    setCurrentOffset(0)
    setHasMore(true)
    
    // Toujours faire une recherche directe pour éviter les problèmes de sessionStorage
    if (query) {
      console.log('🔍 Recherche directe en cours...')
      performSearch(query, 0, true)
    } else {
      setIsLoading(false)
    }
  }, [searchParams])

  // Fonction pour effectuer la recherche avec pagination
  const performSearch = async (searchQuery: string, offset: number = 0, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      
      console.log('🔍 Recherche en cours pour:', searchQuery, `offset: ${offset}`)
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: searchQuery,
          offset: offset,
          limit: ITEMS_PER_PAGE
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 Résultats de recherche reçus:', {
        count: data.results?.length || 0,
        offset: offset,
        hasMore: data.hasMore,
        firstResult: data.results?.[0] ? {
          id: data.results[0].id,
          name: data.results[0].name,
          type: data.results[0].type
        } : 'Aucun résultat'
      })
      
      if (data.results && data.results.length > 0) {
        if (isInitial) {
          setSearchResults(data.results)
          setTotalResults(data.total || 0) // Stocker le total pour l'affichage
        } else {
          setSearchResults(prev => [...prev, ...data.results])
        }
        
        setHasMore(data.hasMore || false)
        setCurrentOffset(offset + ITEMS_PER_PAGE)
      } else {
        if (isInitial) {
          setSearchResults([])
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error)
      if (isInitial) {
        setSearchResults([])
      }
      setHasMore(false)
    } finally {
      if (isInitial) {
        setIsLoading(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }

  // Fonction pour charger plus de résultats
  const loadMoreResults = useCallback(() => {
    console.log('🔄 loadMoreResults appelé:', {
      isLoadingMore,
      hasMore,
      currentOffset,
      searchQuery
    })

    if (!isLoadingMore && hasMore) {
      console.log('✅ Conditions remplies, lancement de performSearch')
      performSearch(searchQuery, currentOffset, false)
    } else {
      console.log('❌ Conditions non remplies pour charger plus')
    }
  }, [searchQuery, currentOffset, isLoadingMore, hasMore])

  // Observer pour le lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('🔍 IntersectionObserver triggered:', {
          isIntersecting: entries[0].isIntersecting,
          hasMore: hasMore,
          isLoadingMore: isLoadingMore,
          currentOffset: currentOffset,
          searchResultsCount: searchResults.length
        })

        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          console.log('🚀 Chargement de plus de résultats...')
          loadMoreResults()
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = observerRef.current
    if (currentRef) {
      console.log('👁️ Observer attaché à l\'élément')
      observer.observe(currentRef)
    } else {
      console.log('❌ observerRef.current est null')
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, isLoadingMore, currentOffset, searchResults.length, loadMoreResults])

  // Plus de données mock - utilisation uniquement des vraies données de la base

  // Utilisation uniquement des vraies données de la base

  // Fonction pour obtenir l'image de fallback selon le type de service
  const getFallbackImage = (serviceType: string): string => {
    const fallbackImages: Record<string, string> = {
      'LIEU': 'https://images.unsplash.com/photo-1519167758481-83f29da8ae39?w=800&h=600&fit=crop',
      'TRAITEUR': 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop',
      'PHOTOGRAPHE': 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&h=600&fit=crop',
      'VOITURE': 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop',
      'MUSIQUE': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop',
      'DECORATION': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop',
      'FLORISTE': 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop',
      'VIDEO': 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&h=600&fit=crop',
      'ANIMATION': 'https://images.unsplash.com/photo-1464047736614-af63643285bf?w=800&h=600&fit=crop',
      'WEDDING_CAKE': 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&h=600&fit=crop',
      'OFFICIANT': 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop',
    }

    return fallbackImages[serviceType] || 'https://images.unsplash.com/photo-1519167758481-83f29da8ae39?w=800&h=600&fit=crop'
  }

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: Record<string, string> = {
      'LIEU': 'Lieu de réception',
      'TRAITEUR': 'Traiteur',
      'PHOTOGRAPHE': 'Photographe',
      'MUSIQUE': 'Musique',
      'FLORISTE': 'Fleuriste',
      'DECORATION': 'Décoration',
      'VOITURE': 'Transport',
      'VIDEO': 'Vidéaste',
      'WEDDING_CAKE': 'Pâtisserie',
      'OFFICIANT': 'Officiant'
    }
    return labels[serviceType] || serviceType
  }

  const formatPrice = (price?: number) => {
    if (!price) return "Prix sur demande"
    return `À partir de ${price.toLocaleString('fr-FR')}€`
  }

  const handleViewDetails = async (result: SearchResult) => {
    console.log('🔍 Redirection vers storefront:', {
      id: result.id,
      name: result.name || result.companyName,
      type: result.type,
      serviceType: result.serviceType
    })
    
    // Debug: vérifier si l'ID est valide
    if (!result.id || result.id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(result.id)) {
      console.error('❌ ID invalide pour la redirection:', result.id)
      alert('Erreur: ID invalide pour ce prestataire')
      return
    }
    
    // Marquer la vitrine comme consultée
    try {
      await fetch('/api/consulted-storefronts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storefrontId: result.id,
          name: result.name || result.companyName || 'Prestataire',
          type: result.type || 'PARTNER',
          serviceType: result.serviceType
        }),
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la consultation:', error)
      // Ne pas bloquer la redirection si la sauvegarde échoue
    }
    
    // Rediriger tous les prestataires vers leur vitrine
    router.push(`/storefront/${result.id}`)
  }

  // Debug: afficher l'état actuel
  console.log('🔍 État actuel:', {
    isLoading,
    isLoadingMore,
    searchResultsCount: searchResults.length,
    hasMore,
    currentOffset,
    searchQuery
  })

  if (isLoading) {
    return (
      <div>
        <PageNavigation />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Résultats pour &quot;{searchQuery}&quot;
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {totalResults} prestataire{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''} correspondant à votre recherche
            </p>
            <div className="mt-6">
              <AISearchBar />
            </div>
          </div>

          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {searchResults.map((result, index) => {
              // Debug: log de chaque résultat
              console.log('🎯 Carte résultat:', {
                id: result.id,
                name: result.name || result.companyName,
                type: result.type,
                serviceType: result.serviceType,
                imageUrl: result.imageUrl, // Debug: vérifier l'imageUrl
                hasImages: !!result.images?.length
              })
              
              // Utiliser un ID unique pour éviter les erreurs de clés dupliquées
              const uniqueKey = `${result.id}-${index}`
              
              const imageUrl = result.imageUrl || result.images?.[0] || getFallbackImage(result.serviceType)

              // Debug: log l'image utilisée
              if (!result.imageUrl && !result.images?.[0]) {
                console.log(`🖼️ Utilisation fallback pour ${result.name || result.companyName} (${result.serviceType}): ${imageUrl}`)
              }

              return (
                <div key={uniqueKey} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={imageUrl}
                    alt={result.name || result.companyName || "Image du prestataire"}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {getServiceTypeLabel(result.serviceType)}
                    </span>
                  </div>
                  {/* MASQUÉ TEMPORAIREMENT - Avis et étoiles */}
                  {/* {result.rating && (
                    <div className="absolute bottom-4 left-4 flex items-center bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium">{result.rating}</span>
                    </div>
                  )} */}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {result.name || result.companyName}
                  </h3>
                  
                  <div 
                    className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: result.description }}
                  />
                  
                  <div className="space-y-2 mb-4">
                    {result.location && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        {result.location}
                      </div>
                    )}
                    
                    {result.price && result.price > 0 && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <BanknotesIcon className="h-4 w-4 mr-2" />
                        {formatPrice(result.price)}
                      </div>
                    )}
                    
                    {result.capacity && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        Jusqu&apos;à {result.capacity} personnes
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewDetails(result)}
                      className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                    >
                      Voir les détails
                    </button>
                    <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                      Contacter
                    </button>
                  </div>
                </div>
              </div>
            )
            })}
          </div>

          {/* Lazy Loading Trigger */}
          {hasMore && (
            <div ref={observerRef} className="mt-8 flex flex-col items-center space-y-4">
              {isLoadingMore && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <span className="text-gray-600 dark:text-gray-400">Chargement...</span>
                </div>
              )}
            </div>
          )}

          {/* Fin des résultats */}
          {!hasMore && searchResults.length > 0 && (
            <div className="mt-8 text-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Tous les résultats ont été chargés ({searchResults.length} résultats)
              </div>
            </div>
          )}

          {searchResults.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Essayez de modifier vos critères de recherche ou utilisez des termes plus généraux.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
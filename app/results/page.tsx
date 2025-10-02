'use client'

import Image from 'next/image'
import AISearchBar from '../components/AISearchBar'
import { PageNavigation } from '../components/PageNavigation'
import { StarIcon } from '@heroicons/react/24/solid'
import { MapPinIcon, BanknotesIcon, CalendarDaysIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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

export default function Results() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    // Récupérer la requête depuis l'URL
    const query = searchParams.get('q') || ''
    setSearchQuery(query)
    
    console.log('🔍 Page Results - Requête:', query)
    
    // Récupérer les résultats depuis sessionStorage
    const storedResults = sessionStorage.getItem('searchResults')
    const storedCriteria = sessionStorage.getItem('searchCriteria')
    
    console.log('💾 Données stockées:', {
      hasStoredResults: !!storedResults,
      hasStoredCriteria: !!storedCriteria
    })
    
    if (storedResults && storedCriteria) {
      try {
        const results = JSON.parse(storedResults)
        const criteria = JSON.parse(storedCriteria)
        
        console.log('📊 Résultats parsés:', {
          count: results.length,
          totalResults: criteria.totalResults,
          firstResult: results[0] ? {
            id: results[0].id,
            companyName: results[0].companyName,
            serviceType: results[0].serviceType
          } : 'Aucun résultat'
        })
        
        // Vérifier que les IDs sont valides (format MongoDB ObjectId)
        const validResults = results.filter((result: any) => 
          result.id && result.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(result.id)
        )
        
        if (validResults.length !== results.length) {
          console.warn('⚠️ Certains résultats ont des IDs invalides:', {
            total: results.length,
            valid: validResults.length,
            invalid: results.length - validResults.length
          })
        }
        
        setSearchResults(validResults.length > 0 ? validResults : results)
        
        // Si les résultats stockés sont limités (50) mais qu'on sait qu'il y en a plus, faire une requête complète
        if (results.length === 50 && criteria.totalResults > 50) {
          console.log('📊 Résultats limités détectés, recherche complète en cours...')
          performSearch(query)
        }
      } catch (error) {
        console.error('Erreur parsing results:', error)
        // En cas d'erreur de parsing, faire une nouvelle recherche
        if (query) {
          console.log('🔍 Erreur parsing, recherche en cours...')
          performSearch(query)
        }
      }
    } else if (query) {
      // Si pas de résultats stockés mais une requête, faire la recherche
      console.log('🔍 Aucun résultat stocké, recherche en cours...')
      performSearch(query)
    } else {
      console.log('⚠️ Aucun résultat stocké et aucune requête')
    }
    
    setIsLoading(false)
  }, [searchParams])

  // Fonction pour effectuer la recherche
  const performSearch = async (searchQuery: string) => {
    try {
      setIsLoading(true)
      console.log('🔍 Recherche en cours pour:', searchQuery)
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      })
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 Résultats de recherche reçus:', {
        count: data.results?.length || 0,
        firstResult: data.results?.[0] ? {
          id: data.results[0].id,
          name: data.results[0].name,
          type: data.results[0].type
        } : 'Aucun résultat'
      })
      
      if (data.results && data.results.length > 0) {
        // Stocker les résultats dans sessionStorage
        sessionStorage.setItem('searchResults', JSON.stringify(data.results))
        sessionStorage.setItem('searchCriteria', JSON.stringify(data.criteria))
        
        // Mettre à jour l'état
        setSearchResults(data.results)
      } else {
        console.log('⚠️ Aucun résultat trouvé pour la requête')
        setSearchResults([])
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Plus de données mock - utilisation uniquement des vraies données de la base

  // Utilisation uniquement des vraies données de la base

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

  // Calculer la pagination
  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedResults = searchResults.slice(startIndex, endIndex)

  // Debug: afficher l'état actuel
  console.log('🔍 État actuel:', {
    isLoading,
    searchResultsCount: searchResults.length,
    paginatedResultsCount: paginatedResults.length,
    currentPage,
    totalPages,
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
              {searchResults.length} prestataire{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''} correspondant à votre recherche
            </p>
            <div className="mt-6">
              <AISearchBar />
            </div>
          </div>

          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedResults.map((result, index) => {
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
              
              return (
                <div key={uniqueKey} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={result.imageUrl || result.images?.[0] || "/placeholder-venue.jpg"}
                    alt={result.name || result.companyName || "Image du prestataire"}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {getServiceTypeLabel(result.serviceType)}
                    </span>
                  </div>
                  {result.rating && (
                    <div className="absolute bottom-4 left-4 flex items-center bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium">{result.rating}</span>
                    </div>
                  )}
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
                    
                    {result.price && (
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

          {/* Pagination */}
          {searchResults.length > 0 && totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNumber)}
                            isActive={currentPage === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className={
                        currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
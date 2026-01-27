"use client";

import { useState } from "react";
import TypeFilter from "@/components/TypeFilter";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useQuery } from "@tanstack/react-query";
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
// import { StarIcon } from '@heroicons/react/24/solid' // MASQUÉ TEMPORAIREMENT - plus utilisé
import { MapPinIcon, BanknotesIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface Prestataire {
  id: string
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
}

const ITEMS_PER_PAGE = 20;

export default function PrestatairesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const router = useRouter();

  const { data, isLoading, error } = useQuery<{
    prestataires: Prestataire[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["prestataires", currentPage, selectedServiceType],
    queryFn: async () => {
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });
      
      if (selectedServiceType) {
        params.append('serviceType', selectedServiceType);
      }
      
      const response = await fetch(`/api/prestataires?${params.toString()}&_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des prestataires");
      }
      return response.json();
    },
  });

  // Types de services avec leurs compteurs réels (LIEU supprimé car doublon avec établissements)
  const serviceTypes = [
    { type: 'DECORATION', label: 'Décoration', count: 3117 },
    { type: 'VOITURE', label: 'Transport', count: 3149 },
    { type: 'TRAITEUR', label: 'Traiteur', count: 2783 },
    { type: 'FLORISTE', label: 'Fleuriste', count: 2170 },
    { type: 'CADEAUX_INVITES', label: 'Cadeaux invités', count: 2095 },
    { type: 'PHOTOGRAPHE', label: 'Photographe', count: 1739 },
    { type: 'FAIRE_PART', label: 'Faire-part', count: 1293 },
    { type: 'ANIMATION', label: 'Animation', count: 1009 },
    { type: 'MUSIQUE', label: 'Musique', count: 847 },
    { type: 'CHAPITEAU', label: 'Chapiteau', count: 358 },
    { type: 'ROBE_MARIEE', label: 'Robe de mariée', count: 0 },
    { type: 'COSTUME', label: 'Costume', count: 0 },
    { type: 'COIFFURE', label: 'Coiffure', count: 0 },
    { type: 'FOOD_TRUCK', label: 'Food truck', count: 19 },
    { type: 'OFFICIANT', label: 'Officiant', count: 2 },
    { type: 'VIDEO', label: 'Video', count: 1 }
  ];

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
      'OFFICIANT': 'Officiant',
      'ROBE_MARIEE': 'Robe de mariée',
      'COSTUME': 'Costume',
      'COIFFURE': 'Coiffure'
    }
    return labels[serviceType] || serviceType
  }

  const formatPrice = (price?: number) => {
    if (!price) return "Prix sur demande"
    return `À partir de ${price.toLocaleString('fr-FR')}€`
  }

  // Fonction pour extraire le texte pur du HTML
  const stripHtml = (html: string | undefined | null): string => {
    if (!html) return ''
    // Créer un élément temporaire pour parser le HTML
    if (typeof window !== 'undefined') {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      return doc.body.textContent || ''
    }
    // Fallback pour SSR: supprimer les balises avec regex
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  const handleViewDetails = async (prestataire: Prestataire) => {
    // Marquer la vitrine comme consultée
    try {
      await fetch('/api/consulted-storefronts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storefrontId: prestataire.id,
          name: prestataire.name || prestataire.companyName || 'Prestataire',
          type: 'PARTNER',
          serviceType: prestataire.serviceType
        }),
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la consultation:', error)
    }
    
    // Rediriger vers la vitrine
    router.push(`/storefront/${prestataire.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">
          Une erreur est survenue lors du chargement des prestataires
        </p>
      </div>
    );
  }

  const handleServiceTypeChange = (serviceType: string) => {
    setSelectedServiceType(serviceType);
    setCurrentPage(1); // Reset à la première page
  };

  const totalPages = data?.totalPages || 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="mb-6 text-2xl sm:text-3xl font-bold">Nos Prestataires</h1>
      
      <TypeFilter
        types={serviceTypes}
        activeType={selectedServiceType}
        onTypeChange={handleServiceTypeChange}
        showAll={true}
      />
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.prestataires.map((prestataire) => (
          <div key={prestataire.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative h-48 bg-gray-100">
              <ImageWithFallback
                src={prestataire.imageUrl || prestataire.images?.[0] || ""}
                alt={prestataire.name || prestataire.companyName || "Image du prestataire"}
                fill
                className="object-cover"
                fallbackClassName="absolute inset-0"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {getServiceTypeLabel(prestataire.serviceType)}
                </span>
              </div>
              {/* MASQUÉ TEMPORAIREMENT - Avis et étoiles */}
              {/* {prestataire.rating && (
                <div className="absolute bottom-4 left-4 flex items-center bg-white/90 px-2 py-1 rounded-full">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="ml-1 text-sm font-medium">{prestataire.rating}</span>
                </div>
              )} */}
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {prestataire.name || prestataire.companyName}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {stripHtml(prestataire.description)}
              </p>
              
              <div className="space-y-2 mb-4">
                {prestataire.location && (
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {prestataire.location}
                  </div>
                )}
                
                {prestataire.price && prestataire.price > 0 && (
                  <div className="flex items-center text-sm text-gray-500">
                    <BanknotesIcon className="h-4 w-4 mr-2" />
                    {formatPrice(prestataire.price)}
                  </div>
                )}
                
                {prestataire.capacity && (
                  <div className="flex items-center text-sm text-gray-500">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Jusqu&apos;à {prestataire.capacity} personnes
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewDetails(prestataire)}
                  className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                >
                  Voir les détails
                </button>
                <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                  Contacter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
    </div>
  );
}

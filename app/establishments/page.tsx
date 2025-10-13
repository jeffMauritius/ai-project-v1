"use client";

import { useState } from "react";
import EstablishmentCard from "../components/EstablishmentCard";
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
import type { Establishment } from "../types/establishment";

const ITEMS_PER_PAGE = 20;

export default function EstablishmentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('');

  const { data, isLoading, error } = useQuery<{
    establishments: Establishment[];
    total: number;
  }>({
    queryKey: ["establishments", currentPage, selectedType],
    queryFn: async () => {
      if (selectedType) {
        // Utiliser l'API de recherche avec POST
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: selectedType,
            offset: (currentPage - 1) * ITEMS_PER_PAGE,
            limit: ITEMS_PER_PAGE
          })
        });
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des établissements");
        }
        
        const searchData = await response.json();
        return {
          establishments: searchData.results || [],
          total: searchData.total || 0
        };
      } else {
        // Utiliser l'API des établissements normale
        const response = await fetch(`/api/establishments?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des établissements");
        }
        return response.json();
      }
    },
  });

  // Types d'établissements avec leurs compteurs
  const establishmentTypes = [
    { type: 'domaine mariage', label: 'Domaine mariage', count: 5482 },
    { type: 'château mariage', label: 'Château mariage', count: 1062 },
    { type: 'salle mariage', label: 'Salle mariage', count: 1006 },
    { type: 'restaurant mariage', label: 'Restaurant mariage', count: 403 },
    { type: 'hôtel mariage', label: 'Hôtel mariage', count: 319 },
    { type: 'bateau mariage', label: 'Bateau mariage', count: 65 },
    { type: 'auberge mariage', label: 'Auberge mariage', count: 56 },
  ];

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
          Une erreur est survenue lors du chargement des établissements
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1); // Reset à la première page
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Nos Établissements</h1>
      
      <TypeFilter
        types={establishmentTypes}
        activeType={selectedType}
        onTypeChange={handleTypeChange}
        showAll={true}
      />
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.establishments.map((establishment) => (
          <EstablishmentCard
            key={establishment.id}
            establishment={establishment}
          />
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
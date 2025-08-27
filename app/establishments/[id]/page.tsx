"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Users } from "lucide-react";
import type { Establishment } from "@/app/types/establishment";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { QuoteRequestForm } from "@/components/ui/QuoteRequestForm";
import { useState } from "react";

export default function EstablishmentPage() {
  const { id } = useParams();
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);

  const { data: establishment, isLoading } = useQuery<Establishment>({
    queryKey: ["establishment", id],
    queryFn: async () => {
      const response = await fetch(`/api/establishments/${id}`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement de l'établissement");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">Établissement non trouvé</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="overflow-hidden">
        <div className="relative h-[400px] w-full">
          <div className="absolute right-4 top-4 z-10">
            <FavoriteButton
              storefrontId={establishment.id}
              name={establishment.name}
              location={establishment.location}
              rating={establishment.rating}
              numberOfReviews={establishment.numberOfReviews}
              description={establishment.description}
              imageUrl={establishment.imageUrl}
              className="rounded-full bg-white/80 hover:bg-white/90"
              size="icon"
            />
          </div>
          <Image
            src={establishment.imageUrl}
            alt={establishment.name}
            fill
            className="object-cover"
            priority
          />
          {establishment.images && establishment.images.length > 0 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              {establishment.images.slice(0, 5).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === 0 ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">{establishment.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-600">{establishment.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="text-gray-600">
                    {establishment.rating} ({establishment.numberOfReviews} avis)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-600">{establishment.capacity}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-pink-600">
                À partir de {establishment.priceRange}
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-600 whitespace-pre-line">{establishment.description}</p>
          </div>

          {/* Galerie d'images */}
          {establishment.images && establishment.images.length > 0 && (
            <div className="mt-8">
              <ImageLightbox 
                images={establishment.images.map((url, index) => ({
                  id: `img-${index}`,
                  url,
                  alt: `${establishment.name} - Image ${index + 1}`
                }))}
                title="Galerie photos"
                gridCols={4}
              />
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4">
            <ShareButton
              url={`${typeof window !== 'undefined' ? window.location.href : ''}`}
              title={`${establishment.name} - ${establishment.location}`}
              showText={true}
              variant="outline"
              size="lg"
            />
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setIsQuoteFormOpen(true)}
            >
              Demander un devis
            </Button>
            <Button variant="default" size="lg">
              Nous contacter
            </Button>
          </div>

          {/* Quote Request Form Modal */}
          <QuoteRequestForm
            storefrontId={establishment.id}
            storefrontName={establishment.name}
            isOpen={isQuoteFormOpen}
            onClose={() => setIsQuoteFormOpen(false)}
          />
        </CardContent>
      </Card>
    </div>
  );
} 
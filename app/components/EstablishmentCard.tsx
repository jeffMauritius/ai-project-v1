'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Establishment } from "../types/establishment";
import { useGallery } from "@/components/ui/GlobalImageGallery";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { useEffect, useState } from "react";

interface EstablishmentCardProps {
  establishment: Establishment;
}

export function EstablishmentCard({ establishment }: EstablishmentCardProps) {
  const { openGallery } = useGallery();
  const [favoriteUrl, setFavoriteUrl] = useState<string>('');
  
  const {
    id,
    name,
    location,
    rating,
    numberOfReviews,
    description,
    priceRange,
    capacity,
    imageUrl,
    images = [],
  } = establishment;

  const allImages = [imageUrl, ...images];

  useEffect(() => {
    // Set the URL only on client side
    setFavoriteUrl(`${window.location.origin}/establishments/${id}`);
  }, [id]);

  return (
    <Card className="w-full overflow-hidden group">
      <div className="relative h-[200px] w-full">
        {/* Favorite Button - Outside the Link */}
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton
            url={favoriteUrl}
            title={`${name} - ${location}`}
            className="rounded-full bg-white/80 hover:bg-white/90"
            size="icon"
          />
        </div>
        
        {/* Link wrapper for the rest of the card */}
        <Link href={`/establishments/${id}`}>
          <div className="absolute left-4 top-4 z-10">
            <span className="rounded-md bg-amber-400 px-2 py-1 text-sm font-semibold">
              TOP
            </span>
          </div>
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Bouton pour ouvrir la galerie */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                openGallery(
                  allImages.map((url, index) => ({
                    id: `card-img-${id}-${index}`,
                    url,
                    alt: `${name} - Image ${index + 1}`
                  }))
                );
              }}
              className="absolute left-4 bottom-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all z-10"
              aria-label="Voir la galerie"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          )}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {allImages.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === 0 ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </Link>
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-lg font-semibold">⭐ {rating}</span>
            <span className="text-sm text-gray-600">
              ({numberOfReviews})
            </span>
            <span className="ml-2 text-sm text-gray-600">{location}</span>
          </div>
        </div>
        <h3 className="mb-2 text-xl font-semibold group-hover:text-pink-600 transition-colors">{name}</h3>
        <p className="mb-4 text-sm text-gray-600 line-clamp-2">{description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">À partir de {priceRange}</span>
            <span className="text-sm text-gray-600">{capacity}</span>
          </div>
          <Button variant="default" className="group-hover:bg-pink-600 transition-colors">
            Voir les détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
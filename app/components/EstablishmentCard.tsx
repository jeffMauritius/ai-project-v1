import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Establishment } from "../types/establishment";

interface EstablishmentCardProps {
  establishment: Establishment;
}

export function EstablishmentCard({ establishment }: EstablishmentCardProps) {
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

  return (
    <Card className="w-full overflow-hidden group">
      <Link href={`/establishments/${id}`}>
        <div className="relative h-[200px] w-full">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 rounded-full bg-white/80 hover:bg-white/90"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Ajouter aux favoris
            }}
          >
            <Heart className="h-5 w-5" />
          </Button>
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
          <div className="absolute bottom-4 left-4 flex gap-2">
            {images.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === 0 ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
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
      </Link>
    </Card>
  );
}
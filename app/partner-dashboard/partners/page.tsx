'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Filter, Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Partner = {
  id: number
  name: string
  type: string
  image: string
  rating: number
  description: string
  website: string
  featured: boolean
}

const mockPartners: Partner[] = [
  {
    id: 1,
    name: "Traiteur Royal",
    type: "Traiteur",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    description: "Service de traiteur haut de gamme spécialisé dans la gastronomie française.",
    website: "www.traiteur-royal.fr",
    featured: true
  },
  {
    id: 2,
    name: "Fleurs & Passion",
    type: "Fleuriste",
    image: "https://images.unsplash.com/photo-1507290439931-a861b5a38200?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    description: "Artisan fleuriste créant des compositions uniques pour votre mariage.",
    website: "www.fleurs-passion.fr",
    featured: true
  }
]

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>(mockPartners)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [filter, setFilter] = useState<'all' | 'featured'>('all')

  const filteredPartners = filter === 'all' 
    ? partners 
    : partners.filter(partner => partner.featured)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Partenaires recommandés
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez vos partenariats et recommandations
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un partenaire
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filter === 'all' ? 'Tous les partenaires' : 'Partenaires mis en avant'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  Tous les partenaires
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('featured')}>
                  Partenaires mis en avant
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Input 
              placeholder="Rechercher un partenaire..." 
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des partenaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => (
          <Card key={partner.id} className={partner.featured ? 'border-pink-500' : ''}>
            <div className="relative h-48">
              <img
                src={partner.image}
                alt={partner.name}
                className="w-full h-full object-cover rounded-t-lg"
              />
              {partner.featured && (
                <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                  Mis en avant
                </div>
              )}
            </div>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {partner.name}
                  </h3>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {partner.type}
                  </p>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                    {partner.rating}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {partner.description}
              </p>
              <div className="flex justify-between items-center">
                <a
                  href={`https://${partner.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-pink-600 hover:text-pink-500"
                >
                  {partner.website}
                </a>
                <Button variant="outline" size="sm" className="gap-2">
                  <X className="h-4 w-4" />
                  Retirer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
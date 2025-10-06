'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Filter, Plus, X, Search, MapPin, Users, Euro } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Partner = {
  id: string
  name: string
  type: string
  image: string
  rating: number
  description: string
  website: string
  featured: boolean
  originalPartnerId?: string
}

type SystemPartner = {
  id: string
  name: string
  type: string
  description: string
  location: string
  images: string[]
  basePrice?: number
  priceRange?: any
  maxCapacity?: number
  minCapacity?: number
  isActive: boolean
  storefrontId?: string
  createdAt: string
  updatedAt: string
}

// Types exactement comme dans le schéma Prisma
const partnerTypes = [
  "LIEU",
  "TRAITEUR", 
  "FAIRE_PART",
  "CADEAUX_INVITES",
  "PHOTOGRAPHE",
  "MUSIQUE",
  "VOITURE",
  "BUS",
  "DECORATION",
  "CHAPITEAU",
  "ANIMATION",
  "FLORISTE",
  "LISTE",
  "ORGANISATION",
  "VIDEO",
  "LUNE_DE_MIEL",
  "WEDDING_CAKE",
  "OFFICIANT",
  "FOOD_TRUCK",
  "VIN"
]

const serviceTypeLabels: { [key: string]: string } = {
  "LIEU": "Lieu de réception",
  "TRAITEUR": "Traiteur",
  "FAIRE_PART": "Faire-part",
  "CADEAUX_INVITES": "Cadeaux invités",
  "PHOTOGRAPHE": "Photographe",
  "MUSIQUE": "Musique",
  "VOITURE": "Voiture",
  "BUS": "Bus",
  "DECORATION": "Décorateur",
  "CHAPITEAU": "Chapiteau",
  "ANIMATION": "Animation",
  "FLORISTE": "Fleuriste",
  "LISTE": "Liste de mariage",
  "ORGANISATION": "Organisation",
  "VIDEO": "Vidéaste",
  "LUNE_DE_MIEL": "Lune de miel",
  "WEDDING_CAKE": "Gâteau de mariage",
  "OFFICIANT": "Officiant",
  "FOOD_TRUCK": "Food truck",
  "VIN": "Vin"
}

// Fonction utilitaire pour tronquer la description à la première ligne
const truncateDescription = (description: string, maxLength: number = 100) => {
  if (description.length <= maxLength) return description
  
  // Trouver le premier point, point d'exclamation ou point d'interrogation
  const firstSentenceEnd = description.search(/[.!?]/)
  if (firstSentenceEnd > 0 && firstSentenceEnd <= maxLength) {
    return description.substring(0, firstSentenceEnd + 1)
  }
  
  // Sinon, tronquer à la longueur maximale
  return description.substring(0, maxLength) + '...'
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [filter, setFilter] = useState<'all' | 'featured'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // États pour la liste des partenaires du système
  const [systemPartners, setSystemPartners] = useState<SystemPartner[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Charger les partenaires recommandés depuis la base de données
  const fetchRecommendedPartners = async () => {
    try {
      const response = await fetch('/api/recommended-partners')
      const data = await response.json()
      
      if (response.ok) {
        setPartners(data.partners)
      } else {
        console.error('Erreur lors du chargement des partenaires recommandés:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires recommandés:', error)
    }
  }

  // Charger les partenaires du système
  const fetchSystemPartners = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(selectedType !== 'all' && { serviceType: selectedType }),
        ...(searchTerm && { search: searchTerm })
      })
      
      console.log('Fetching with params:', params.toString())
      
      const response = await fetch(`/api/partners?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setSystemPartners(data.partners)
        setTotalPages(data.totalPages)
        console.log('Received partners:', data.partners.map(p => ({ name: p.name, type: p.type })))
      } else {
        console.error('Erreur lors du chargement des partenaires:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendedPartners()
  }, [])

  useEffect(() => {
    if (isDialogOpen) {
      fetchSystemPartners()
    }
  }, [isDialogOpen, selectedType, searchTerm, page])

  const handleAddPartner = async (systemPartner: SystemPartner) => {
    try {
      const response = await fetch('/api/recommended-partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: systemPartner.name,
          type: serviceTypeLabels[systemPartner.type] || systemPartner.type,
          image: systemPartner.images[0] || "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
          rating: 4.5,
          description: systemPartner.description,
          website: `www.${systemPartner.name.toLowerCase().replace(/\s+/g, '-')}.fr`,
          featured: false,
          originalPartnerId: systemPartner.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPartners([...partners, data.partner])
      } else {
        const errorData = await response.json()
        console.error('Erreur lors de l\'ajout du partenaire:', errorData.error)
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du partenaire:', error)
    }
  }

  const handleRemovePartner = async (id: string) => {
    try {
      const response = await fetch(`/api/recommended-partners/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPartners(partners.filter(p => p.id !== id))
      } else {
        const errorData = await response.json()
        console.error('Erreur lors de la suppression du partenaire:', errorData.error)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du partenaire:', error)
    }
  }

  const filteredPartners = filter === 'all' 
    ? partners 
    : partners.filter(partner => partner.featured)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nos Partenaires
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez vos partenariats et recommandations
          </p>
        </div>
        
        {/* Modal de sélection des partenaires */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un partenaire
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Selectionner un partenaire</DialogTitle>
            </DialogHeader>
            
            {/* Filtres - Fixes en haut */}
            <div className="flex-shrink-0 space-y-4 border-b pb-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Rechercher</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Nom, description, ville..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-64">
                  <Label htmlFor="type">Types de Partenaire</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {partnerTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {serviceTypeLabels[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Zone de contenu scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-gray-500">Chargement...</div>
                </div>
              ) : systemPartners.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-gray-500">Aucun partenaire trouvé</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                  {systemPartners.map((partner) => (
                    <Card key={partner.id} className="hover:shadow-md transition-shadow">
                      <div className="relative h-32">
                        <Image
                          src={partner.images[0] || "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"}
                          alt={partner.name}
                          fill
                          className="object-cover rounded-t-lg"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {partner.isActive && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                            Actif
                          </div>
                        )}
                      </div>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {partner.name}
                          </h3>
                          <p className="text-sm text-pink-600 dark:text-pink-400">
                            {serviceTypeLabels[partner.type] || partner.type}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {truncateDescription(partner.description)}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {partner.location}
                          </div>
                          {partner.maxCapacity && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Users className="h-3 w-3 mr-1" />
                              Jusqu&apos;à {partner.maxCapacity} personnes
                            </div>
                          )}
                          {partner.basePrice && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Euro className="h-3 w-3 mr-1" />
                              À partir de {partner.basePrice}€
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => handleAddPartner(partner)}
                        >
                          Ajouter aux recommandations
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination - Fixe en bas */}
            {totalPages > 1 && (
              <div className="flex-shrink-0 flex justify-center items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}

            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <Image
                src={partner.image}
                alt={partner.name}
                fill
                className="object-cover rounded-t-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-1">
                {truncateDescription(partner.description)}
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => handleRemovePartner(partner.id)}
                >
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

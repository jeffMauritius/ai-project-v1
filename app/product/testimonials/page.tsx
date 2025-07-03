'use client'

import { useState, useEffect } from 'react'
import { PageNavigation } from '../../components/PageNavigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"
import { StarIcon } from '@heroicons/react/24/solid'

const testimonials = [
  {
    id: 1,
    name: "Marie et Pierre",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    date: "Juin 2023",
    rating: 5,
    category: "Lieu",
    content: "MonMariage.ai nous a permis d'organiser notre mariage sereinement. L'assistant IA a été d'une aide précieuse pour trouver les meilleurs prestataires selon nos critères."
  },
  {
    id: 2,
    name: "Sophie et Thomas",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    date: "Août 2023",
    rating: 5,
    category: "Organisation",
    content: "Une plateforme complète et intuitive qui nous a fait gagner beaucoup de temps. Le plan de table interactif est particulièrement bien pensé."
  },
  {
    id: 3,
    name: "Julie et Antoine",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    date: "Septembre 2023",
    rating: 5,
    category: "Prestataires",
    content: "Excellent outil pour la gestion des invités et la communication avec les prestataires. Le support client est très réactif."
  },
  {
    id: 4,
    name: "Léa et Nicolas",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    date: "Octobre 2023",
    rating: 5,
    category: "Liste de mariage",
    content: "La fonction de liste de mariage et cagnotte en ligne a été très appréciée par nos invités. Tout est simple et bien pensé."
  },
  {
    id: 5,
    name: "Emma et Lucas",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    date: "Novembre 2023",
    rating: 5,
    category: "IA",
    content: "Nous avons adoré l'aspect IA de la plateforme qui nous a fait découvrir des prestataires que nous n'aurions pas trouvés autrement."
  },
  {
    id: 6,
    name: "Chloé et Maxime",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    date: "Décembre 2023",
    rating: 5,
    category: "Global",
    content: "Un grand merci à l'équipe de MonMariage.ai pour avoir rendu l'organisation de notre mariage si agréable et efficace."
  }
]

const categories = ["Tous", "Lieu", "Organisation", "Prestataires", "Liste de mariage", "IA", "Global"]

export default function Testimonials() {
  const [selectedCategory, setSelectedCategory] = useState("Tous")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const filteredTestimonials = selectedCategory === "Tous"
    ? testimonials
    : testimonials.filter(t => t.category === selectedCategory)

  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ils nous font confiance
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Découvrez les témoignages de couples qui ont organisé leur mariage avec MonMariage.ai
            </p>
            <div className="mt-8 flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {selectedCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {mounted && filteredTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-0.5 mt-2">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/20 px-2 py-1 rounded-full">
                        {testimonial.category}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      {testimonial.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
'use client'

import Image from 'next/image'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageNavigation from '../../components/PageNavigation'
import { StarIcon } from '@heroicons/react/24/solid'
import { MapPinIcon, BanknotesIcon, CalendarDaysIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, PaperAirplaneIcon, MicrophoneIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const defaultPartners = [
  {
    id: 1,
    name: "Traiteur Royal",
    type: "Traiteur",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    rating: 4.8
  },
  {
    id: 2,
    name: "Fleurs & Passion",
    type: "Fleuriste",
    image: "https://images.unsplash.com/photo-1507290439931-a861b5a38200?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    rating: 4.9
  },
  {
    id: 3,
    name: "DJ Atmosphère",
    type: "DJ",
    image: "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    rating: 4.7
  }
]

const mockVenues = [{
  id: "1",
  title: "Château de Vaux-le-Vicomte",
  description: `Le Château de Vaux-le-Vicomte, joyau architectural du XVIIe siècle, vous ouvre ses portes pour faire de votre mariage un événement véritablement royal. Situé à seulement 55 km de Paris, ce chef-d'œuvre de l'architecture classique française allie magnificence historique et confort moderne.

Construit entre 1656 et 1661 pour Nicolas Fouquet, surintendant des finances de Louis XIV, le château a accueilli les plus grandes célébrations de l'histoire de France. Aujourd'hui, il perpétue cette tradition en offrant un cadre incomparable pour votre mariage.

Le domaine comprend :
• Un château majestueux de 1200m² avec ses salons d'apparat
• Des jardins à la française dessinés par Le Nôtre s'étendant sur 33 hectares
• Une orangerie du XVIIe siècle pouvant accueillir jusqu'à 300 convives
• Des jardins à la française illuminés par 2000 bougies pour une atmosphère féérique

Services inclus :
• Coordinateur dédié pour votre événement
• Accès privatif aux jardins pour vos photos
• Vestiaires et salon privé pour les mariés
• Parking sécurisé pour 150 véhicules
• Possibilité d'atterrissage en hélicoptère

Le château propose différentes formules adaptées à vos besoins, de la location simple aux prestations tout inclus. Notre équipe expérimentée vous accompagnera dans chaque étape de l'organisation pour créer un mariage qui vous ressemble.`,
  images: [
    "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
  ],
  rating: 4.9,
  location: "Maincy, France",
  price: "À partir de 15000€",
  availability: "Disponible en 2024",
  options: [
    "Capacité jusqu'à 300 personnes",
    "Hébergement sur place (20 chambres)",
    "Parking privé (150 places)",
    "Cuisine équipée pour traiteur",
    "Espace cocktail intérieur et extérieur",
    "Possibilité de cérémonie laïque dans les jardins",
    "Salon de préparation pour les mariés",
    "Accès PMR"
  ],
  partners: defaultPartners
}, {
  id: "2",
  title: "Domaine des Roses",
  description: `Le Domaine des Roses est un élégant domaine viticole offrant une vue panoramique exceptionnelle sur les vignes de Saint-Émilion. Ce lieu unique combine le charme d'un château historique avec le prestige d'un grand cru classé.

Le domaine s'étend sur 30 hectares de vignes et comprend :
• Une salle de réception voûtée du XVIIIe siècle
• Une terrasse panoramique surplombant le vignoble
• Une cave historique pour les dégustations
• Un parc paysager de 5 hectares

Services inclus :
• Coordination personnalisée de votre événement
• Dégustation de vins pour vos invités
• Séance photo dans les vignes
• Parking privé
• Service de navettes`,
  images: [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1543721575-9f66b584d005?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1562524708-43d5d2fe8c76?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
  ],
  rating: 4.7,
  location: "Saint-Émilion, France",
  price: "À partir de 8000€",
  availability: "Disponible en 2024",
  options: [
    "Capacité jusqu'à 200 personnes",
    "Hébergement sur place (10 chambres)",
    "Parking privé (100 places)",
    "Cave à vin historique",
    "Terrasse panoramique",
    "Possibilité de cérémonie en extérieur",
    "Salle climatisée",
    "Accès PMR"
  ],
  partners: defaultPartners
}, {
  id: "3",
  title: "Manoir de la Loire",
  description: `Le Manoir de la Loire est un joyau architectural du XVIe siècle niché au cœur de la Vallée de la Loire. Ce lieu d'exception offre un cadre romantique et historique parfait pour votre mariage.

Le manoir propose :
• Une salle de réception médiévale authentique
• Des jardins à la française classés
• Une chapelle privée du XVIe siècle
• Une vue imprenable sur la Loire

Services inclus :
• Coordinateur de mariage dédié
• Accès exclusif aux jardins
• Suite nuptiale de luxe
• Service de voiturier
• Éclairage architectural nocturne`,
  images: [
    "https://images.unsplash.com/photo-1568314735654-58688d2c2313?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1513107358949-b21c1c3906eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505159940484-eb2b9f2588e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
  ],
  rating: 4.8,
  location: "Amboise, France",
  price: "À partir de 12000€",
  availability: "Disponible en 2024",
  options: [
    "Capacité jusqu'à 150 personnes",
    "Hébergement sur place (15 chambres)",
    "Parking privé (80 places)",
    "Chapelle privée",
    "Jardins classés",
    "Suite nuptiale de luxe",
    "Cuisine professionnelle",
    "Accès PMR"
  ],
  partners: defaultPartners
}]

export default function VenueDetail({ id }: { id: string }) {
  const venue = mockVenues.find(v => v.id === id) || mockVenues[0]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [chatMessage, setChatMessage] = useState('')
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % venue.images.length)
  }
  
  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + venue.images.length) % venue.images.length)
  }

  return (
    <>
      <Navbar />
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            {/* Gallery */}
            <div className="relative h-[600px] mb-8 group">
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentImageIndex}
                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ 
                    duration: 0.5,
                    ease: "easeInOut"
                  }}>
                  <Image
                    src={venue.images[currentImageIndex]}
                    alt={`${venue.title} - Vue ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            
              <div className="absolute inset-0 z-10 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={previousImage}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </div>
            
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {venue.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-[600px] mb-8 flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Bonjour ! Je suis l&apos;assistant virtuel du {venue.title}. Comment puis-je vous aider à planifier votre événement ?
                  </p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 ml-8">
                  <p className="text-gray-600 dark:text-gray-300">
                    Je souhaite organiser un mariage pour 150 personnes en juin 2024.
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Excellent choix ! Le château peut accueillir jusqu&apos;à 300 personnes et nous avons encore des disponibilités en juin 2024. Souhaitez-vous des informations sur nos formules de réception ou sur l&apos;hébergement des invités ?
                  </p>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Posez vos questions sur le lieu..."
                  className="block w-full rounded-xl border-0 py-4 pl-4 pr-32 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500/50 resize-none"
                  rows={3}
                />
                <div className="absolute right-2 bottom-2 flex gap-2">
                  <button 
                    type="button"
                    className="p-2 rounded-lg text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Commande vocale"
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                  </button>
                  <button 
                    type="button"
                    className="p-2 rounded-lg text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Ajouter un fichier"
                  >
                    <DocumentPlusIcon className="h-5 w-5" />
                  </button>
                  <button 
                    type="submit" 
                    className="p-2 rounded-lg bg-pink-600 hover:bg-pink-500 transition-colors"
                  >
                    <PaperAirplaneIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Venue Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 lg:col-span-5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{venue.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {venue.location}
                  </div>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    {venue.rating}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{venue.price}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{venue.availability}</div>
              </div>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
              {venue.description.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-600 dark:text-gray-300">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {/* Options */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Options et Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {venue.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    {option}
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-500 transition-colors text-lg font-semibold">
              Contacter l&apos;établissement
            </button>
          </div>

          {/* Partners */}
          <div className="lg:col-span-5">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Partenaires recommandés</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {venue.partners.map((partner) => (
                <div key={partner.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                  <div className="h-48">
                    <div className="relative w-full h-full">
                      <Image
                        src={partner.image}
                        alt={partner.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{partner.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{partner.type}</p>
                      </div>
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{partner.rating}</span>
                      </div>
                    </div>
                    <a 
                      href={`/partner/${partner.id}`}
                      className="block w-full mt-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm text-center"
                    >
                      Voir le profil
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
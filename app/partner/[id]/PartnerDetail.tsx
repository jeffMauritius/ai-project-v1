'use client'

import Image from 'next/image'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageNavigation from '../../components/PageNavigation'
import { StarIcon } from '@heroicons/react/24/solid'
import { MapPinIcon, BanknotesIcon, CalendarDaysIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, PaperAirplaneIcon, MicrophoneIcon, DocumentPlusIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const mockPartners = {
  "1": {
    id: "1",
    title: "Traiteur Royal",
    type: "Traiteur",
    description: `Traiteur de luxe spécialisé dans la gastronomie française, le Traiteur Royal met son savoir-faire à votre service pour créer un moment d'exception.

Notre équipe de chefs étoilés crée des menus personnalisés pour votre mariage, alliant tradition française et créativité moderne.

Notre offre comprend :
• Une dégustation personnalisée pour les mariés
• Un service à table professionnel
• Des buffets gastronomiques sur mesure
• Une cave à vins d'exception
• Un wedding cake artisanal
• Un bar à champagne élégant

Services inclus :
• Chef de cuisine dédié
• Maître d'hôtel coordinateur
• Personnel de service qualifié
• Arts de la table haut de gamme
• Installation et désinstallation complète`,
    images: [
      "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
    ],
    rating: 4.8,
    location: "Paris, France",
    price: "À partir de 90€/personne",
    availability: "Disponible en 2024",
    options: [
      "Service pour 50 à 500 personnes",
      "Cuisine sur place possible",
      "Menu végétarien disponible",
      "Options sans gluten",
      "Service de wedding cake",
      "Bar à cocktails",
      "Personnel de service inclus",
      "Vaisselle et décoration de table"
    ],
    contact: {
      phone: "+33 1 23 45 67 89",
      email: "contact@traiteur-royal.fr"
    }
  },
  "2": {
    id: "2",
    title: "Fleurs & Passion",
    type: "Fleuriste",
    description: `Fleurs & Passion est un atelier floral d'excellence, spécialisé dans la création d'atmosphères uniques pour les mariages.

Notre équipe d'artisans fleuristes crée des compositions sur mesure qui reflètent votre personnalité et subliment votre événement.

Nos créations comprennent :
• Bouquets de mariée personnalisés
• Compositions pour la cérémonie
• Décoration florale des tables
• Arches et structures florales
• Boutonnières et accessoires
• Couronnes de fleurs

Services inclus :
• Consultation personnalisée
• Moodboard et proposition détaillée
• Installation et démontage
• Fleurs de saison
• Service de location de vases et supports`,
    images: [
      "https://images.unsplash.com/photo-1507290439931-a861b5a38200?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494336934272-f0efcedfc8d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
    ],
    rating: 4.9,
    location: "Lyon, France",
    price: "À partir de 2000€",
    availability: "Disponible en 2024",
    options: [
      "Bouquet de mariée sur mesure",
      "Décoration de cérémonie",
      "Centres de table",
      "Arches florales",
      "Location de vases",
      "Fleurs de saison",
      "Installation comprise",
      "Service de conseil"
    ],
    contact: {
      phone: "+33 4 56 78 90 12",
      email: "contact@fleurs-passion.fr"
    }
  },
  "3": {
    id: "3",
    title: "DJ Atmosphère",
    type: "DJ",
    description: `DJ Atmosphère est votre partenaire musical pour créer une ambiance inoubliable lors de votre mariage.

Fort de 15 ans d'expérience dans l'animation de mariages, nous savons créer l'ambiance parfaite pour chaque moment de votre soirée.

Notre prestation comprend :
• Une sonorisation professionnelle complète
• Un éclairage architectural et d'ambiance
• Un système de karaoké haute qualité
• Une cabine DJ design
• Des effets spéciaux (machine à fumée, stroboscopes)
• Une playlist personnalisée

Services inclus :
• Rendez-vous de préparation
• Installation et démontage
• Backup matériel complet
• Technicien son et lumière
• Assurance professionnelle`,
    images: [
      "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
    ],
    rating: 4.7,
    location: "Bordeaux, France",
    price: "À partir de 1200€",
    availability: "Disponible en 2024",
    options: [
      "Sonorisation jusqu'à 300 personnes",
      "Éclairage architectural",
      "Machine à fumée",
      "Karaoké professionnel",
      "Playlist personnalisée",
      "Mix en direct",
      "Backup matériel",
      "Technicien inclus"
    ],
    contact: {
      phone: "+33 5 34 56 78 90",
      email: "contact@dj-atmosphere.fr"
    }
  }
}

export default function PartnerDetail({ id }: { id: string }) {
  const partner = mockPartners[id as keyof typeof mockPartners]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [chatMessage, setChatMessage] = useState('')
  
  if (!partner) {
    return <div>Partenaire non trouvé</div>
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % partner.images.length)
  }
  
  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + partner.images.length) % partner.images.length)
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
                    src={partner.images[currentImageIndex]}
                    alt={`${partner.title} - Vue ${currentImageIndex + 1}`}
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
                {partner.images.map((_, index) => (
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
                    Bonjour ! Je suis l&apos;assistant virtuel du {partner.title}. Comment puis-je vous aider à planifier votre événement ?
                  </p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 ml-8">
                  <p className="text-gray-600 dark:text-gray-300">
                    Je souhaite organiser un mariage pour 150 personnes en juin 2024.
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Excellent choix ! Nous pouvons assurer le service pour votre mariage. Souhaitez-vous des informations sur nos formules ou un devis personnalisé ?
                  </p>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Posez vos questions..."
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

          {/* Partner Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 lg:col-span-5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{partner.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {partner.location}
                  </div>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    {partner.rating}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{partner.price}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{partner.availability}</div>
              </div>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
              {partner.description.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-600 dark:text-gray-300">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {/* Options */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Services et Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {partner.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    {option}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <a 
                href={`tel:${partner.contact.phone}`}
                className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <PhoneIcon className="h-5 w-5" />
                {partner.contact.phone}
              </a>
              <a 
                href={`mailto:${partner.contact.email}`}
                className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <EnvelopeIcon className="h-5 w-5" />
                {partner.contact.email}
              </a>
            </div>

            <button className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-500 transition-colors text-lg font-semibold">
              Demander un devis
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
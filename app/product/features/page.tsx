'use client'

import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageNavigation from '../../components/PageNavigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles, Users, Calendar, MessageSquare, Search, PenTool, Gift, BrainCircuit } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const features = [
  {
    title: "Assistant IA intelligent",
    description: "Notre assistant IA comprend vos besoins et vous guide tout au long de l'organisation.",
    icon: BrainCircuit,
    items: [
      "Suggestions personnalisées basées sur vos préférences",
      "Recommandations contextuelles intelligentes",
      "Analyse prédictive des tendances",
      "Assistance 24/7 par chat"
    ]
  },
  {
    title: "Gestion des invités",
    description: "Gérez facilement votre liste d'invités et le plan de table interactif.",
    icon: Users,
    items: [
      "Liste d'invités collaborative",
      "Plan de table drag & drop",
      "Gestion des groupes et familles",
      "Suivi des réponses en temps réel"
    ]
  },
  {
    title: "Planning intelligent",
    description: "Organisez chaque aspect de votre mariage avec notre planning interactif.",
    icon: Calendar,
    items: [
      "Timeline personnalisée",
      "Rappels automatiques",
      "Synchronisation avec votre agenda",
      "Liste de tâches intelligente"
    ]
  },
  {
    title: "Communication centralisée",
    description: "Gardez le contact avec vos prestataires et invités en un seul endroit.",
    icon: MessageSquare,
    items: [
      "Messagerie intégrée",
      "Partage de documents",
      "Notifications en temps réel",
      "Historique des conversations"
    ]
  },
  {
    title: "Recherche avancée",
    description: "Trouvez les meilleurs prestataires selon vos critères spécifiques.",
    icon: Search,
    items: [
      "Filtres multicritères",
      "Comparaison de prestataires",
      "Avis vérifiés",
      "Suggestions personnalisées"
    ]
  },
  {
    title: "Personnalisation",
    description: "Créez un mariage qui vous ressemble avec nos outils de personnalisation.",
    icon: PenTool,
    items: [
      "Thèmes et styles personnalisables",
      "Palettes de couleurs",
      "Moodboards interactifs",
      "Inspiration sur mesure"
    ]
  },
  {
    title: "Liste de mariage",
    description: "Gérez votre liste de mariage et votre cagnotte en toute simplicité.",
    icon: Gift,
    items: [
      "Liste de souhaits collaborative",
      "Cagnotte en ligne sécurisée",
      "Suivi des contributions",
      "Remerciements automatisés"
    ]
  },
  {
    title: "Expérience unique",
    description: "Profitez d'une expérience exceptionnelle avec des fonctionnalités exclusives.",
    icon: Sparkles,
    items: [
      "Interface intuitive",
      "Mode sombre élégant",
      "Application mobile responsive",
      "Support premium"
    ]
  }
]

export default function Features() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <Navbar />
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fonctionnalités
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Découvrez tous les outils et fonctionnalités qui font de MonMariage.ai la plateforme idéale pour organiser votre mariage.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {mounted && features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="relative overflow-hidden group">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <feature.icon className="h-8 w-8" />
                        </div>
                      </div>
                      <CardTitle className="flex items-center gap-2">
                        {feature.title}
                      </CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <Check className="h-4 w-4 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
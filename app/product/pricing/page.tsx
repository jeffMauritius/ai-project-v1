'use client'

import { useState } from 'react'
import { PageNavigation } from '../../components/PageNavigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { motion } from "framer-motion"

const plans = [
  {
    name: "Gratuit",
    price: "0€",
    description: "Pour commencer à planifier",
    features: [
      "Recherche de prestataires",
      "Planning de base",
      "Liste d'invités simple",
      "Messagerie limitée"
    ]
  },
  {
    name: "Premium",
    price: "19.99€",
    period: "par mois",
    description: "Pour une organisation complète",
    popular: true,
    features: [
      "Toutes les fonctionnalités gratuites",
      "Assistant IA avancé",
      "Plan de table interactif",
      "Liste de mariage et cagnotte",
      "Messagerie illimitée",
      "Support prioritaire"
    ]
  },
  {
    name: "Pro",
    price: "49.99€",
    period: "par mois",
    description: "Pour les professionnels",
    features: [
      "Toutes les fonctionnalités Premium",
      "Multi-projets",
      "Statistiques avancées",
      "API d'intégration",
      "Support dédié 24/7",
      "Formation personnalisée"
    ]
  }
]

export default function Pricing() {
  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tarifs simples et transparents
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Tous nos plans incluent un essai gratuit de 14 jours.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Card key={index} className={plan.popular ? 'border-pink-500 dark:border-pink-400' : ''}>
                {plan.popular && (
                  <div className="absolute top-0 right-6 transform -translate-y-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-500 text-white">
                      Populaire
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-500 dark:text-gray-400">/{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    {`Commencer l'essai gratuit`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
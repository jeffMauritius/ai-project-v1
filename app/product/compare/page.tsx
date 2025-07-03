'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

import { motion } from "framer-motion"

const plans = [
  {
    name: "Gratuit",
    price: "0€",
    period: "pour toujours",
    description: "Pour commencer à planifier",
    features: {
      "Recherche de prestataires": true,
      "Planning de base": true,
      "Liste d'invités simple": true,
      "Messagerie limitée": true,
      "Assistant IA": false,
      "Plan de table interactif": false,
      "Liste de mariage et cagnotte": false,
      "Messagerie illimitée": false,
      "Support prioritaire": false,
      "Badge Premium": false,
      "Accès aux mariages VIP": false,
      "Formation marketing": false,
      "API d'intégration": false,
      "Multi-projets": false,
      "Statistiques avancées": false
    }
  },
  {
    name: "Premium",
    price: "19.99€",
    period: "par mois",
    description: "Pour une organisation complète",
    popular: true,
    features: {
      "Recherche de prestataires": true,
      "Planning de base": true,
      "Liste d'invités simple": true,
      "Messagerie limitée": true,
      "Assistant IA": true,
      "Plan de table interactif": true,
      "Liste de mariage et cagnotte": true,
      "Messagerie illimitée": true,
      "Support prioritaire": true,
      "Badge Premium": false,
      "Accès aux mariages VIP": false,
      "Formation marketing": false,
      "API d'intégration": false,
      "Multi-projets": false,
      "Statistiques avancées": false
    }
  },
  {
    name: "Pro",
    price: "49.99€",
    period: "par mois",
    description: "Pour les professionnels",
    features: {
      "Recherche de prestataires": true,
      "Planning de base": true,
      "Liste d'invités simple": true,
      "Messagerie limitée": true,
      "Assistant IA": true,
      "Plan de table interactif": true,
      "Liste de mariage et cagnotte": true,
      "Messagerie illimitée": true,
      "Support prioritaire": true,
      "Badge Premium": true,
      "Accès aux mariages VIP": true,
      "Formation marketing": true,
      "API d'intégration": true,
      "Multi-projets": true,
      "Statistiques avancées": true
    }
  }
]

export default function ComparePage() {
  const [selectedPlans, setSelectedPlans] = useState<string[]>(["Premium", "Pro"])

  const filteredPlans = plans.filter(plan => selectedPlans.includes(plan.name))

  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-grow">
        <section className="container px-4 md:px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comparer les plans
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choisissez les plans à comparer pour trouver celui qui correspond le mieux à vos besoins.
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {plans.map((plan) => (
              <Button
                key={plan.name}
                variant={selectedPlans.includes(plan.name) ? "default" : "outline"}
                onClick={() => {
                  if (selectedPlans.includes(plan.name)) {
                    setSelectedPlans(selectedPlans.filter(p => p !== plan.name))
                  } else if (selectedPlans.length < 3) {
                    setSelectedPlans([...selectedPlans, plan.name])
                  }
                }}
                disabled={selectedPlans.length >= 3 && !selectedPlans.includes(plan.name)}
              >
                {plan.name}
              </Button>
            ))}
          </div>

          <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${filteredPlans.length}, 1fr)` }}>
            {filteredPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={plan.popular ? 'border-pink-500 dark:border-pink-400' : ''}>
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
                      <span className="text-gray-500 dark:text-gray-400">/{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(plan.features).map(([feature, included]) => (
                        <div key={feature} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                          {included ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-6" variant={plan.popular ? 'default' : 'outline'}>
                      Choisir {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
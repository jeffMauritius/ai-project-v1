'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, CreditCard, Calendar, Building2, ArrowRight } from "lucide-react"

const plans = [
  {
    name: "Essentiel",
    price: "29",
    description: "L'essentiel pour démarrer",
    features: [
      "Profil professionnel",
      "Messagerie avec les clients",
      "Jusqu'à 10 photos",
      "Statistiques de base"
    ]
  },
  {
    name: "Pro",
    price: "79",
    description: "Pour les professionnels établis",
    features: [
      "Tout de l'offre Essentiel",
      "Photos illimitées",
      "Mise en avant dans les recherches",
      "Statistiques avancées",
      "Support prioritaire"
    ],
    popular: true
  },
  {
    name: "Premium",
    price: "149",
    description: "Pour une visibilité maximale",
    features: [
      "Tout de l'offre Pro",
      "Badge Premium sur votre profil",
      "Accès aux mariages VIP",
      "Accompagnement personnalisé",
      "Formation marketing incluse"
    ]
  }
]

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<string>('Pro')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Abonnement et Paiement
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choisissez le plan qui correspond le mieux à vos besoins. Tous nos plans incluent un essai gratuit de 14 jours.
        </p>

        {/* Toggle Mensuel/Annuel */}
        <div className="mt-6 flex justify-center">
          <div className="relative flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`${
                billingInterval === 'monthly'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600'
              } px-4 py-2 text-sm font-medium rounded-md transition-colors`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`${
                billingInterval === 'yearly'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600'
              } px-4 py-2 text-sm font-medium rounded-md transition-colors`}
            >
              Annuel (-20%)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
          const price = billingInterval === 'yearly' 
            ? Math.round(parseInt(plan.price) * 0.8)
            : plan.price

          return (
            <Card 
              key={plan.name}
              className={`relative ${plan.popular ? 'border-pink-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-pink-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Populaire
                  </span>
                </div>
              )}
              
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {price}€
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    /{billingInterval === 'yearly' ? 'an' : 'mois'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => setSelectedPlan(plan.name)}
                  className="w-full"
                  variant={selectedPlan === plan.name ? 'default' : 'outline'}
                >
                  {selectedPlan === plan.name ? 'Plan actuel' : 'Sélectionner'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Informations de paiement */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Informations de paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                  Carte de crédit
                </h3>
                <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      •••• •••• •••• 4242
                    </p>
                    <p className="text-sm text-gray-500">Expire le 12/24</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Modifier
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                  Facturation
                </h3>
                <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Building2 className="h-6 w-6 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Château de Vaux-le-Vicomte
                    </p>
                    <p className="text-sm text-gray-500">FR 12 345 678 901</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Modifier
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                Prochain paiement
              </h3>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-4 mb-4">
                  <Calendar className="h-6 w-6 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      15 février 2024
                    </p>
                    <p className="text-sm text-gray-500">Prochain renouvellement</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Plan Pro</span>
                    <span className="text-gray-900 dark:text-white">79,00 €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TVA (20%)</span>
                    <span className="text-gray-900 dark:text-white">15,80 €</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-gray-900 dark:text-white">94,80 €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    15 Jan 2024
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    Plan Pro - Janvier 2024
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    94,80 €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Payé
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    15 Déc 2023
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    Plan Pro - Décembre 2023
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    94,80 €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Payé
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
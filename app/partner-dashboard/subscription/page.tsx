'use client'

import { useState } from 'react'
import { CheckIcon } from '@heroicons/react/24/outline'

const plans = [
  {
    name: 'Essentiel',
    price: '29',
    description: 'L\'essentiel pour démarrer',
    features: [
      'Profil professionnel',
      'Messagerie avec les clients',
      'Jusqu\'à 10 photos',
      'Statistiques de base'
    ]
  },
  {
    name: 'Pro',
    price: '79',
    description: 'Pour les professionnels établis',
    features: [
      'Tout de l\'offre Essentiel',
      'Photos illimitées',
      'Mise en avant dans les recherches',
      'Statistiques avancées',
      'Support prioritaire'
    ],
    popular: true
  },
  {
    name: 'Premium',
    price: '149',
    description: 'Pour une visibilité maximale',
    features: [
      'Tout de l\'offre Pro',
      'Badge "Premium" sur votre profil',
      'Accès aux mariages VIP',
      'Accompagnement personnalisé',
      'Formation marketing incluse'
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
            <div 
              key={plan.name}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg ${
                plan.popular ? 'ring-2 ring-pink-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-pink-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Populaire
                  </span>
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>
                <div className="flex items-baseline mb-8">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {price}€
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    /{billingInterval === 'yearly' ? 'an' : 'mois'}
                  </span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                    selectedPlan === plan.name
                      ? 'bg-pink-600 text-white hover:bg-pink-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {selectedPlan === plan.name ? 'Plan actuel' : 'Sélectionner'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Informations de paiement */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Informations de paiement
        </h2>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titulaire de la carte
              </label>
              <input
                type="text"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numéro de carte
              </label>
              <input
                type="text"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="4242 4242 4242 4242"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date d&apos;expiration
              </label>
              <input
                type="text"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="MM/AA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Code de sécurité (CVC)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="123"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-500 transition-colors"
          >
            Mettre à jour l&apos;abonnement
          </button>
        </form>
      </div>

      {/* Historique des paiements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Historique des paiements
        </h2>
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
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  15 Jan 2024
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  Abonnement Pro - Janvier 2024
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  79,00 €
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Payé
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  15 Déc 2023
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  Abonnement Pro - Décembre 2023
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  79,00 €
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Payé
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  15 Nov 2023
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  Abonnement Pro - Novembre 2023
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  79,00 €
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Payé
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
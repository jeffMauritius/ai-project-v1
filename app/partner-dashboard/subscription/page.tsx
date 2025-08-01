'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, CreditCard, Calendar, Building2, ArrowRight, Loader2 } from "lucide-react"
import { useSubscription } from '@/hooks/useSubscription'
import { useToast } from '@/hooks/useToast'
import { SubscriptionErrorAlert } from '@/components/SubscriptionErrorAlert'

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<string>('Pro')
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [errorAlertProps, setErrorAlertProps] = useState<any>(null)
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  const { subscription, billingInfo, plans, loading, createSubscription, cancelSubscription } = useSubscription()
  const { showSuccess, showSubscriptionError, showWarning, showSubscriptionAlert } = useToast()

  const handleCreateSubscription = async (planId: string) => {
    try {
      // Pour l'instant, on utilise des données de facturation par défaut
      const defaultBillingInfo = {
        billingName: "Château de Vaux-le-Vicomte",
        billingEmail: "contact@vaux-le-vicomte.com",
        billingAddress: "77950 Maincy",
        billingCity: "Maincy",
        billingPostalCode: "77950",
        billingCountry: "France",
        siret: "12345678901234"
      } as const

      await createSubscription(planId, billingInterval, defaultBillingInfo)
      showSuccess("Votre abonnement a été créé avec succès. Vous bénéficiez d'un essai gratuit de 14 jours.", {
        title: "✅ Abonnement créé"
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création de l'abonnement"
      
      // Pour l'erreur d'abonnement existant, on peut utiliser l'alerte dialog
      if (errorMessage.includes("Un abonnement actif existe déjà")) {
        const alertProps = showSubscriptionAlert({
          errorType: 'existing_subscription',
          errorMessage: errorMessage,
          onAction: () => {
            setShowErrorAlert(false)
            // Ici vous pourriez naviguer vers la gestion de l'abonnement
          },
          actionLabel: "Gérer mon abonnement"
        })
        setErrorAlertProps(alertProps)
        setShowErrorAlert(true)
      } else {
        showSubscriptionError(errorMessage)
      }
    }
  }

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription(true)
      showSuccess("Votre abonnement sera annulé à la fin de la période actuelle. Vous continuerez à bénéficier de vos services jusqu'à cette date.", {
        title: "✅ Abonnement annulé"
      })
    } catch (error) {
      showSubscriptionError(error instanceof Error ? error.message : "Erreur lors de l'annulation de l'abonnement")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }



  // Filtrer les plans selon l'intervalle de facturation
  const filteredPlans = plans.filter(plan => plan.billingInterval === billingInterval)

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
              onClick={() => setBillingInterval('MONTHLY')}
              className={`${
                billingInterval === 'MONTHLY'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600'
              } px-4 py-2 text-sm font-medium rounded-md transition-colors`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('YEARLY')}
              className={`${
                billingInterval === 'YEARLY'
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
        {filteredPlans.map((plan) => {
          return (
            <Card 
              key={plan.id}
              className={`relative ${plan.isPopular ? 'border-pink-500' : ''}`}
            >
              {plan.isPopular && (
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
                    {plan.price}€
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    /{billingInterval === 'YEARLY' ? 'an' : 'mois'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature: string) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCreateSubscription(plan.id)}
                  className="w-full"
                  variant={subscription?.planId === plan.id ? 'default' : 'outline'}
                  disabled={subscription?.planId === plan.id}
                >
                  {subscription?.planId === plan.id ? 'Plan actuel' : 'Sélectionner'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Abonnement actuel */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Votre abonnement actuel</CardTitle>
            <CardDescription>
              Statut: {subscription.status === 'TRIAL' ? 'Essai gratuit' : 'Actif'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                  Plan actuel
                </h3>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {subscription.plan.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {subscription.plan.description}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {subscription.plan.price}€ / {subscription.plan.billingInterval === 'YEARLY' ? 'an' : 'mois'}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                  Période actuelle
                </h3>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">
                    Du {new Date(subscription.currentPeriodStart).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Au {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                  </p>
                  {subscription.cancelAtPeriodEnd && (
                    <p className="text-sm text-orange-600 mt-2">
                      ⚠️ Annulé à la fin de la période
                    </p>
                  )}
                </div>
              </div>
            </div>
            {!subscription.cancelAtPeriodEnd && (
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={handleCancelSubscription}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Annuler l&apos;abonnement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informations de paiement */}
      {showPaymentInfo && (
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
      )}

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

      {/* Alert Dialog pour les erreurs importantes */}
      {showErrorAlert && errorAlertProps && (
        <SubscriptionErrorAlert
          isOpen={showErrorAlert}
          onClose={() => setShowErrorAlert(false)}
          {...errorAlertProps}
        />
      )}
    </div>
  )
}
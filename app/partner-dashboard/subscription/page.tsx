/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, CreditCard, Calendar, Building2, ArrowRight, Loader2, AlertCircle, TestTube, CheckCircle } from "lucide-react"
import { useSubscription } from '@/hooks/useSubscription'
import { useToast } from '@/hooks/useToast'
import { SubscriptionErrorAlert } from '@/components/SubscriptionErrorAlert'
import { SubscriptionChangeDialog } from '@/components/ui/SubscriptionChangeDialog'

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<string>('Pro')
  const [billingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [errorAlertProps, setErrorAlertProps] = useState<any>(null)
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [showChangeDialog, setShowChangeDialog] = useState(false)
  const [pendingPlanChange, setPendingPlanChange] = useState<{planId: string, planName: string, price: number} | null>(null)
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { subscription, billingInfo, plans, loading, error, createSubscriptionWithStripe, cancelSubscription } = useSubscription()
  const { showSuccess, showSubscriptionError, showWarning, showSubscriptionAlert } = useToast()

  // Détecter le mode test depuis l'URL
  useEffect(() => {
    const testParam = searchParams.get('test')
    if (testParam === 'true') {
      setTestMode(true)
    }
  }, [searchParams])

  // Gérer le retour de Stripe Checkout
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')

    if (success && sessionId) {
      showSuccess("Votre abonnement a été créé avec succès ! Vous bénéficiez d'un essai gratuit de 14 jours.", {
        title: "✅ Abonnement créé"
      })
    } else if (canceled) {
      showWarning("Le processus de paiement a été annulé. Vous pouvez réessayer à tout moment.")
    }
  }, [searchParams, showSuccess, showWarning])

  const handleCreateSubscription = async (planId: string) => {
    try {
      // Données de facturation par défaut (à remplacer par un formulaire)
      const defaultBillingInfo = {
        street: "123 Rue de Test",
        city: "Paris",
        postalCode: "75001",
        country: "France",
        companyName: "Test Company",
        siret: "12345678901234",
        vatNumber: "FR12345678901"
      }

      await createSubscriptionWithStripe(planId, billingInterval, defaultBillingInfo)
    } catch (error) {
      console.error('Erreur lors de la création de l\'abonnement:', error)
      
      // Vérifier si c'est un conflit d'abonnement
      const subscriptionError = error as Error & { isSubscriptionConflict?: boolean; existingSubscription?: any }
      
      if (subscriptionError.isSubscriptionConflict) {
        // Trouver le plan actuel et le nouveau plan
        const currentPlan = subscriptionError.existingSubscription
        const newPlan = plans.find(p => p.id === planId)
        
        if (newPlan) {
          setPendingPlanChange({
            planId,
            planName: newPlan.name,
            price: newPlan.price
          })
          setShowChangeDialog(true)
          return
        }
      }
      
      showSubscriptionError(error instanceof Error ? error.message : "Erreur lors de la création de l'abonnement")
    }
  }

  const handleConfirmPlanChange = async () => {
    if (!pendingPlanChange) return
    
    try {
      // Données de facturation par défaut
      const defaultBillingInfo = {
        street: "123 Rue de Test",
        city: "Paris",
        postalCode: "75001",
        country: "France",
        companyName: "Test Company",
        siret: "12345678901234",
        vatNumber: "FR12345678901"
      }

      await createSubscriptionWithStripe(pendingPlanChange.planId, billingInterval, defaultBillingInfo)
      setShowChangeDialog(false)
      setPendingPlanChange(null)
    } catch (error) {
      console.error('Erreur lors du changement d\'abonnement:', error)
      showSubscriptionError(error instanceof Error ? error.message : "Erreur lors du changement d'abonnement")
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

  // Plans de test (simulés)
  const testPlans = [
    {
      id: 'test-premium-monthly',
      name: 'Premium',
      description: 'Pour une organisation complète',
      price: 19.99,
      currency: 'EUR',
      billingInterval: 'MONTHLY' as const,
      features: [
        'Toutes les fonctionnalités gratuites',
        'Assistant IA avancé',
        'Plan de table interactif',
        'Liste de mariage et cagnotte',
        'Messagerie illimitée',
        'Support prioritaire'
      ],
      isActive: true,
      isPopular: true,
      maxPhotos: 100
    },
    {
      id: 'test-pro-monthly',
      name: 'Pro',
      description: 'Pour les professionnels',
      price: 49.99,
      currency: 'EUR',
      billingInterval: 'MONTHLY' as const,
      features: [
        'Toutes les fonctionnalités Premium',
        'Multi-projets',
        'Statistiques avancées',
        'API d\'intégration',
        'Support dédié 24/7',
        'Formation personnalisée'
      ],
      isActive: true,
      isPopular: false,
      maxPhotos: 1000
    }
  ]

  // Affichage du loading
  if (status === 'loading' || (loading && !testMode)) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Chargement...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Récupération de vos informations d'abonnement
          </p>
        </div>
      </div>
    )
  }

  // Affichage si non connecté
  if (status === 'unauthenticated' && !testMode) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connexion requise
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Vous devez être connecté pour accéder à vos abonnements.
          </p>
          <Button asChild>
            <a href="/auth/login">Se connecter</a>
          </Button>
        </div>
      </div>
    )
  }

  // Affichage des erreurs
  if (error && !testMode) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error}
          </p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Utiliser les plans de test si en mode test
  const displayPlans = testMode ? testPlans : plans
  const filteredPlans = displayPlans.filter(plan => plan.billingInterval === 'MONTHLY')

  return (
    <div className="max-w-7xl mx-auto">
      {testMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TestTube className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                Mode Test Stripe Activé
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTestMode(false)}
            >
              Désactiver
            </Button>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Abonnement et Paiement
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choisissez le plan qui correspond le mieux à vos besoins. Tous nos plans incluent un essai gratuit de 14 jours.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {filteredPlans.map((plan) => {
          const isCurrentPlan = subscription?.planId === plan.id
          return (
            <Card 
              key={plan.id}
              className={`relative transition-all duration-200 ${
                isCurrentPlan 
                  ? 'border-green-500 border-2 shadow-lg shadow-green-100 dark:shadow-green-900/20' 
                  : plan.isPopular 
                    ? 'border-pink-500' 
                    : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Plan actuel
                  </span>
                </div>
              )}
              {plan.isPopular && !isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-pink-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Populaire
                  </span>
                </div>
              )}
              
              <CardHeader className={isCurrentPlan ? 'bg-green-50 dark:bg-green-900/10' : ''}>
                <CardTitle className={isCurrentPlan ? 'text-green-700 dark:text-green-300' : ''}>
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${isCurrentPlan ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
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
                      <Check className={`h-5 w-5 mr-3 ${isCurrentPlan ? 'text-green-500' : 'text-green-500'}`} />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={isCurrentPlan ? handleCancelSubscription : () => handleCreateSubscription(plan.id)}
                  className="w-full"
                  variant={isCurrentPlan ? 'destructive' : 'outline'}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Traitement...
                    </>
                  ) : isCurrentPlan ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Annuler
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      S'abonner
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Informations sur l'abonnement actuel */}
      {subscription && !testMode && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Votre abonnement actuel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {subscription.status === 'TRIAL' ? 'Essai gratuit' : 'Actif'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {subscription.plan?.name || 'Inconnu'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subscription.status === 'TRIAL' ? 'Fin essai' : 'Prochain paiement'}
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions de test */}
      {testMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Mode Test Stripe</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            Vous êtes en mode test. Utilisez les cartes de test Stripe pour simuler les paiements.
          </p>
          <div>
            <h3 className="font-semibold mb-2">Cartes de test :</h3>
            <ul className="space-y-1 text-sm list-decimal list-inside">
              <li>Cliquez sur "S'abonner"</li>
              <li>Vous serez redirigé vers Stripe Checkout</li>
              <li>Remplissez les informations de carte</li>
              <li>Confirmez le paiement</li>
              <li>Vous serez redirigé vers la page de succès</li>
            </ul>
          </div>
        </div>
      )}

      {/* Affichage des erreurs d'abonnement */}
      {showErrorAlert && errorAlertProps && (
        <SubscriptionErrorAlert
          {...errorAlertProps}
          onClose={() => setShowErrorAlert(false)}
        />
      )}

      {/* Dialogue de changement d'abonnement */}
      {showChangeDialog && pendingPlanChange && subscription && (
        <SubscriptionChangeDialog
          isOpen={showChangeDialog}
          onClose={() => {
            setShowChangeDialog(false)
            setPendingPlanChange(null)
          }}
          onConfirm={handleConfirmPlanChange}
          currentPlan={{
            name: subscription.plan?.name || 'Inconnu',
            price: subscription.plan?.price || 0,
            billingInterval: billingInterval
          }}
          newPlan={{
            name: pendingPlanChange.planName,
            price: pendingPlanChange.price,
            billingInterval: billingInterval
          }}
          loading={loading}
        />
      )}
    </div>
  )
}

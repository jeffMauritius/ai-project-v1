'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, CreditCard, Calendar, Building2, ArrowRight, Loader2, AlertCircle, TestTube } from "lucide-react"
import { useSubscription } from '@/hooks/useSubscription'
import { useToast } from '@/hooks/useToast'
import { SubscriptionErrorAlert } from '@/components/SubscriptionErrorAlert'

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<string>('Pro')
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [errorAlertProps, setErrorAlertProps] = useState<any>(null)
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  const [testMode, setTestMode] = useState(false)
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
        billingName: "Château de Vaux-le-Vicomte",
        billingEmail: "contact@vaux-le-vicomte.com",
        billingAddress: "77950 Maincy",
        billingCity: "Maincy",
        billingPostalCode: "77950",
        billingCountry: "France",
        siret: "12345678901234"
      } as const

      await createSubscriptionWithStripe(planId, billingInterval, defaultBillingInfo)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création de l'abonnement"
      
      // Pour l'erreur d'abonnement existant, on peut utiliser l'alerte dialog
      if (errorMessage.includes("Un abonnement actif existe déjà")) {
        const alertProps = {
          errorType: 'existing_subscription' as const,
          errorMessage: errorMessage,
          onAction: () => {
            setShowErrorAlert(false)
            // Ici vous pourriez naviguer vers la gestion de l'abonnement
          },
          actionLabel: "Gérer mon abonnement"
        }
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

  // Affichage de l'état de chargement
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Mode de test - affichage spécial
  if (testMode || (error && error.includes('Vous devez être connecté'))) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <TestTube className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Mode Test - Intégration Stripe
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            La base de données a des problèmes de connexion, mais vous pouvez tester l'intégration Stripe directement.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              🧪 Test de l'Intégration Stripe
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Vous pouvez tester les fonctionnalités de paiement Stripe même sans connexion à la base de données.
            </p>
            <Button 
              onClick={() => setTestMode(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Activer le Mode Test
            </Button>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
              🔧 Résolution du Problème de Base de Données
            </h3>
            <p className="text-yellow-800 dark:text-yellow-200 mb-4">
              Pour résoudre le problème d'authentification MongoDB :
            </p>
            <ul className="text-left text-yellow-800 dark:text-yellow-200 space-y-2">
              <li>1. Allez sur <a href="https://cloud.mongodb.com/" target="_blank" className="underline">MongoDB Atlas</a></li>
              <li>2. Vérifiez que l'utilisateur "aiproject" existe</li>
              <li>3. Vérifiez que le mot de passe est correct</li>
              <li>4. Vérifiez que l'IP est autorisée (0.0.0.0/0)</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Affichage si l'utilisateur n'est pas connecté
  if (status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
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
            <Button variant="outline" onClick={() => setTestMode(true)}>
              <TestTube className="h-4 w-4 mr-2" />
              Mode Test Stripe
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Utiliser les plans de test si en mode test
  const displayPlans = testMode ? testPlans : plans
  const filteredPlans = displayPlans.filter(plan => plan.billingInterval === billingInterval)

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
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
                  disabled={subscription?.planId === plan.id || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Traitement...
                    </>
                  ) : subscription?.planId === plan.id ? (
                    'Plan actuel'
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      S'abonner avec Stripe
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Guide de test Stripe */}
      {testMode && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TestTube className="h-5 w-5 mr-2" />
              Guide de Test Stripe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Cartes de Test Stripe :</h3>
                <ul className="space-y-2 text-sm">
                  <li><strong>Succès :</strong> 4242 4242 4242 4242 (exp: 12/34, CVC: 123)</li>
                  <li><strong>Échec :</strong> 4000 0000 0000 0002 (exp: 12/34, CVC: 123)</li>
                  <li><strong>3D Secure :</strong> 4000 0025 0000 3155 (exp: 12/34, CVC: 123)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Étapes de Test :</h3>
                <ol className="space-y-1 text-sm list-decimal list-inside">
                  <li>Cliquez sur "S'abonner avec Stripe"</li>
                  <li>Vous serez redirigé vers Stripe Checkout</li>
                  <li>Remplissez les informations de carte</li>
                  <li>Confirmez le paiement</li>
                  <li>Vous serez redirigé vers la page de succès</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

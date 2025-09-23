'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Building2, Calendar, Loader2 } from "lucide-react"
import { useSubscription } from '@/hooks/useSubscription'

interface StripePaymentInfoProps {
  showPaymentInfo: boolean
  setShowPaymentInfo: (show: boolean) => void
}

export function StripePaymentInfo({ showPaymentInfo, setShowPaymentInfo }: StripePaymentInfoProps) {
  const { subscription, billingInfo, loading } = useSubscription()
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false)

  useEffect(() => {
    if (showPaymentInfo && subscription?.stripeSubscriptionId) {
      fetchPaymentMethods()
    }
  }, [showPaymentInfo, subscription])

  const fetchPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true)
      // Ici vous pourriez appeler une API pour récupérer les méthodes de paiement
      // Pour l'instant, on simule des données
      setPaymentMethods([
        {
          id: 'pm_1234567890',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2024
          }
        }
      ])
    } catch (error) {
      console.error('Erreur lors de la récupération des méthodes de paiement:', error)
    } finally {
      setLoadingPaymentMethods(false)
    }
  }

  if (!showPaymentInfo) return null

  return (
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
              {loadingPaymentMethods ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          •••• •••• •••• {method.card.last4}
                        </p>
                        <p className="text-sm text-gray-500">
                          Expire le {method.card.exp_month}/{method.card.exp_year}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                Facturation
              </h3>
              <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Building2 className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {billingInfo?.billingName || 'Non défini'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {billingInfo?.billingAddress}, {billingInfo?.billingCity}
                  </p>
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
                    {subscription?.currentPeriodEnd ? 
                      new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR') : 
                      'Non défini'
                    }
                  </p>
                  <p className="text-sm text-gray-500">Prochain renouvellement</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan {subscription?.plan.name}</span>
                  <span className="text-gray-900 dark:text-white">{subscription?.plan.price}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">TVA (20%)</span>
                  <span className="text-gray-900 dark:text-white">{(subscription?.plan.price * 0.2).toFixed(2)}€</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">{(subscription?.plan.price * 1.2).toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

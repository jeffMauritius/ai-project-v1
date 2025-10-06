import { useState } from 'react'
import { stripePromise } from '@/lib/stripe-client'

interface UseStripeReturn {
  loading: boolean
  createCheckoutSession: (planId: string, billingInterval: 'MONTHLY' | 'YEARLY', billingInfo: any) => Promise<void>
  createCustomer: () => Promise<string | null>
}

export function useStripe(): UseStripeReturn {
  const [loading, setLoading] = useState(false)

  const createCustomer = async (): Promise<string | null> => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création du customer')
      }

      const data = await response.json()
      return data.customerId
    } catch (error) {
      console.error('Erreur lors de la création du customer:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const createCheckoutSession = async (
    planId: string, 
    billingInterval: 'MONTHLY' | 'YEARLY', 
    billingInfo: any
  ): Promise<void> => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingInterval,
          billingInfo
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Si c'est une erreur d'abonnement existant, on retourne des infos détaillées
        if (response.status === 400 && errorData.existingSubscription) {
          const error = new Error(errorData.error || 'Erreur lors de la création de la session de checkout')
          ;(error as any).isSubscriptionConflict = true
          ;(error as any).existingSubscription = errorData.existingSubscription
          throw error
        }
        
        throw new Error(errorData.error || 'Erreur lors de la création de la session de checkout')
      }

      const { sessionId, url } = await response.json()

      if (url) {
        // Rediriger vers Stripe Checkout
        window.location.href = url
      } else {
        // Utiliser Stripe.js pour rediriger
        const stripe = await stripePromise
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId
          })
          
          if (error) {
            throw new Error(error.message)
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session de checkout:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createCheckoutSession,
    createCustomer
  }
}

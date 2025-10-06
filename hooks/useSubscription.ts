import { useState, useEffect } from 'react'
import { Subscription, SubscriptionPlan, BillingInfo } from '@/types/subscription'
import { useStripe } from './useStripe'

// Types pour les données de facturation
interface BillingInfoData {
  billingName: string
  billingEmail: string
  billingAddress: string
  billingCity: string
  billingPostalCode: string
  billingCountry: string
  siret?: string
  vatNumber?: string
}

interface UseSubscriptionReturn {
  subscription: Subscription | null
  billingInfo: BillingInfo | null
  plans: SubscriptionPlan[]
  loading: boolean
  error: string | null
  createSubscription: (planId: string, billingInterval: 'MONTHLY' | 'YEARLY', billingInfo: BillingInfoData) => Promise<void>
  createSubscriptionWithStripe: (planId: string, billingInterval: 'MONTHLY' | 'YEARLY', billingInfo: BillingInfoData) => Promise<void>
  cancelSubscription: (cancelAtPeriodEnd?: boolean) => Promise<void>
  updateBillingInfo: (billingInfo: Partial<BillingInfoData>) => Promise<void>
  refreshSubscription: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { createCheckoutSession } = useStripe()

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/subscription')
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Vous devez être connecté pour accéder à vos abonnements')
          return
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setSubscription(data.subscription)
      setBillingInfo(data.billingInfo)
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'abonnement:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des plans')
      }
      const data = await response.json()
      setPlans(data)
    } catch (err) {
      console.error('Erreur lors de la récupération des plans:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des plans')
    }
  }

  const createSubscription = async (planId: string, billingInterval: 'MONTHLY' | 'YEARLY', billingInfo: BillingInfoData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/subscription', {
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
        throw new Error(errorData.error || 'Erreur lors de la création de l\'abonnement')
      }

      const data = await response.json()
      setSubscription(data.subscription)
      setBillingInfo(data.billingInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'abonnement')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createSubscriptionWithStripe = async (planId: string, billingInterval: 'MONTHLY' | 'YEARLY', billingInfo: BillingInfoData) => {
    try {
      setLoading(true)
      setError(null)
      await createCheckoutSession(planId, billingInterval, billingInfo)
    } catch (err) {
      const error = err as Error & { isSubscriptionConflict?: boolean; existingSubscription?: any }
      
      if (error.isSubscriptionConflict) {
        // Ne pas définir d'erreur pour les conflits d'abonnement, on les gère dans l'UI
        setError(null)
      } else {
        setError(error.message || 'Erreur lors de la création de l\'abonnement')
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }

  const cancelSubscription = async (cancelAtPeriodEnd: boolean = true) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtPeriodEnd
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'annulation de l\'abonnement')
      }

      const data = await response.json()
      setSubscription(data.subscription)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation de l\'abonnement')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateBillingInfo = async (billingInfo: Partial<BillingInfoData>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/subscription/billing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingInfo
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour des informations de facturation')
      }

      const data = await response.json()
      setBillingInfo(data.billingInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des informations de facturation')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshSubscription = async () => {
    await fetchSubscription()
  }

  useEffect(() => {
    fetchSubscription()
    fetchPlans()
  }, [])

  return {
    subscription,
    billingInfo,
    plans,
    loading,
    error,
    createSubscription,
    createSubscriptionWithStripe,
    cancelSubscription,
    updateBillingInfo,
    refreshSubscription
  }
}

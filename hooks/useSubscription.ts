import { useState, useEffect } from 'react'
import { Subscription, SubscriptionPlan, BillingInfo } from '@/types/subscription'

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
  createSubscription: (planId: string, billingInterval: 'MONTHLY' | 'YEARLY', billingInfo: BillingInfoData) => Promise<void>
  cancelSubscription: (cancelAtPeriodEnd?: boolean) => Promise<void>
  updateBillingInfo: (billingInfo: Partial<BillingInfoData>) => Promise<void>
  refreshSubscription: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscription')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'abonnement')
      }
      const data = await response.json()
      setSubscription(data.subscription)
      setBillingInfo(data.billingInfo)
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'abonnement:', err)
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
    }
  }

  const createSubscription = async (planId: string, billingInterval: 'MONTHLY' | 'YEARLY', billingInfo: BillingInfoData) => {
    try {
      setLoading(true)
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
      throw err
    } finally {
      setLoading(false)
    }
  }

  const cancelSubscription = async (cancelAtPeriodEnd: boolean = true) => {
    try {
      setLoading(true)
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
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateBillingInfo = async (billingInfo: Partial<BillingInfoData>) => {
    try {
      setLoading(true)
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
    createSubscription,
    cancelSubscription,
    updateBillingInfo,
    refreshSubscription
  }
} 
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'TRIAL'
export type BillingInterval = 'MONTHLY' | 'YEARLY'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  billingInterval: BillingInterval
  features: string[]
  isActive: boolean
  isPopular: boolean
  maxPhotos?: number
  createdAt: Date
  updatedAt: Date
}

export interface BillingInfo {
  id: string
  cardLast4?: string
  cardBrand?: string
  cardExpMonth?: number
  cardExpYear?: number
  billingName: string
  billingEmail: string
  billingAddress: string
  billingCity: string
  billingPostalCode: string
  billingCountry: string
  siret?: string
  vatNumber?: string
  stripeCustomerId?: string
  stripePaymentMethodId?: string
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface Subscription {
  id: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialStart?: Date
  trialEnd?: Date
  stripeSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
  userId: string
  planId: string
  plan: SubscriptionPlan
  payments: Payment[]
}

export interface Payment {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  stripePaymentIntentId?: string
  stripeInvoiceId?: string
  description: string
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
  subscriptionId: string
}

export interface CreateSubscriptionRequest {
  planId: string
  billingInterval: BillingInterval
  billingInfo: Omit<BillingInfo, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
}

export interface UpdateBillingInfoRequest {
  billingInfo: Partial<Omit<BillingInfo, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>
}

export interface CancelSubscriptionRequest {
  cancelAtPeriodEnd: boolean
} 
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planId, billingInterval } = body

    console.log('[TEST_SUBSCRIPTION] Début de la création pour userId:', userId)

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    console.log('[TEST_SUBSCRIPTION] Utilisateur trouvé:', user.email)

    // Vérifier si le plan existe
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan non trouvé' },
        { status: 404 }
      )
    }

    console.log('[TEST_SUBSCRIPTION] Plan trouvé:', plan.name, 'Prix:', plan.price)

    // Créer ou récupérer le customer Stripe
    let customerId = user.stripeCustomerId

    if (!customerId) {
      console.log('[TEST_SUBSCRIPTION] Création du customer Stripe')
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id
        }
      })
      customerId = customer.id

      // Mettre à jour l'utilisateur avec l'ID du customer Stripe
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      })
      console.log('[TEST_SUBSCRIPTION] Customer Stripe créé:', customerId)
    } else {
      console.log('[TEST_SUBSCRIPTION] Customer Stripe existant:', customerId)
    }

    // Créer le produit et le prix dans Stripe
    console.log('[TEST_SUBSCRIPTION] Création du produit Stripe')
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        planId: plan.id
      }
    })

    console.log('[TEST_SUBSCRIPTION] Produit créé:', product.id)

    // Créer le prix
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(plan.price * 100), // Convertir en centimes
      currency: 'eur',
      recurring: {
        interval: billingInterval === 'YEARLY' ? 'year' : 'month'
      },
      metadata: {
        planId: plan.id,
        billingInterval: billingInterval
      }
    })

    console.log('[TEST_SUBSCRIPTION] Prix créé:', price.id)

    // Créer l'abonnement Stripe
    console.log('[TEST_SUBSCRIPTION] Création de l\'abonnement Stripe')
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      trial_period_days: 14, // 14 jours d'essai gratuit
      metadata: {
        userId: user.id,
        planId: plan.id
      }
    })

    console.log('[TEST_SUBSCRIPTION] Abonnement Stripe créé:', stripeSubscription.id)

    // Calculer les dates de période
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 jours d'essai

    // Créer l'abonnement dans notre base de données
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: planId,
        status: 'TRIAL',
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd: trialEnd,
        stripeSubscriptionId: stripeSubscription.id
      },
      include: {
        plan: true
      }
    })

    console.log('[TEST_SUBSCRIPTION] Abonnement créé dans la base de données:', subscription.id)

    return NextResponse.json({
      success: true,
      subscription,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customerId,
      stripeProductId: product.id,
      stripePriceId: price.id
    })
  } catch (error) {
    console.error('[TEST_SUBSCRIPTION] Erreur détaillée:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de l\'abonnement', 
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

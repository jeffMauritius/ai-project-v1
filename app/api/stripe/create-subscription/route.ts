import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId, billingInterval, billingInfo } = body

    if (!planId || !billingInterval || !billingInfo) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

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

    // Vérifier s'il y a déjà un abonnement actif
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['ACTIVE', 'TRIAL']
        }
      }
    })

    if (existingSubscription) {
      return NextResponse.json(
        { 
          error: 'Un abonnement actif existe déjà',
          details: 'Vous avez déjà un abonnement en cours. Vous pouvez modifier votre plan actuel ou annuler votre abonnement existant avant d\'en créer un nouveau.'
        },
        { status: 400 }
      )
    }

    // Créer ou récupérer le customer Stripe
    let customerId = user.stripeCustomerId

    if (!customerId) {
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
    }

    // Créer ou mettre à jour les informations de facturation
    const billingInfoData = await prisma.billingInfo.upsert({
      where: { userId: user.id },
      update: {
        ...billingInfo,
        updatedAt: new Date()
      },
      create: {
        ...billingInfo,
        userId: user.id
      }
    })

    // Créer le produit et le prix dans Stripe si ils n'existent pas
    let stripePriceId: string

    try {
      // Chercher le prix existant
      const prices = await stripe.prices.list({
        product: plan.name,
        active: true,
        limit: 1
      })

      if (prices.data.length > 0) {
        stripePriceId = prices.data[0].id
      } else {
        // Créer le produit
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            planId: plan.id
          }
        })

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

        stripePriceId = price.id
      }
    } catch (stripeError) {
      console.error('Erreur Stripe:', stripeError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du produit Stripe' },
        { status: 500 }
      )
    }

    // Créer l'abonnement Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: stripePriceId }],
      trial_period_days: 14, // 14 jours d'essai gratuit
      metadata: {
        userId: user.id,
        planId: plan.id
      }
    })

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

    return NextResponse.json({
      subscription,
      billingInfo: billingInfoData,
      stripeSubscriptionId: stripeSubscription.id
    })
  } catch (error) {
    console.error('Erreur lors de la création de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'abonnement' },
      { status: 500 }
    )
  }
}

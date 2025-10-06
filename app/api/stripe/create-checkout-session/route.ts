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

    // Vérifier s'il y a déjà un abonnement (quel que soit le statut)
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id
      },
      include: {
        plan: true
      }
    })

    if (existingSubscription) {
      console.log('[CHECKOUT] Abonnement existant trouvé:', existingSubscription.id, 'Status:', existingSubscription.status)
      
      // Vérifier si c'est le même plan
      const isSamePlan = existingSubscription.planId === planId
      
      // Si l'abonnement est actif ou en essai et c'est le même plan, on refuse
      if ((existingSubscription.status === 'ACTIVE' || existingSubscription.status === 'TRIAL') && isSamePlan) {
        return NextResponse.json(
          { 
            error: 'Abonnement identique déjà actif',
            details: `Vous avez déjà un abonnement actif pour le plan "${existingSubscription.plan?.name}".`,
            existingSubscription: {
              id: existingSubscription.id,
              status: existingSubscription.status,
              planName: existingSubscription.plan?.name
            }
          },
          { status: 400 }
        )
      }
      
      // Si c'est un changement de plan, on autorise
      if (existingSubscription.status === 'ACTIVE' || existingSubscription.status === 'TRIAL') {
        console.log('[CHECKOUT] Changement de plan autorisé:', {
          from: existingSubscription.plan?.name,
          to: plan.name,
          currentStatus: existingSubscription.status
        })
      } else {
        // Si l'abonnement est annulé ou expiré, on peut le mettre à jour
        console.log('[CHECKOUT] Mise à jour de l\'abonnement existant:', existingSubscription.id)
      }
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
        billingName: billingInfo.billingName || billingInfo.companyName || user.name || 'Non renseigné',
        billingEmail: billingInfo.billingEmail || user.email,
        billingAddress: billingInfo.billingAddress || billingInfo.street || 'Non renseigné',
        billingCity: billingInfo.billingCity || billingInfo.city || 'Non renseigné',
        billingPostalCode: billingInfo.billingPostalCode || billingInfo.postalCode || '00000',
        billingCountry: billingInfo.billingCountry || billingInfo.country || 'France',
        siret: billingInfo.siret || null,
        vatNumber: billingInfo.vatNumber || null,
        updatedAt: new Date()
      },
      create: {
        billingName: billingInfo.billingName || billingInfo.companyName || user.name || 'Non renseigné',
        billingEmail: billingInfo.billingEmail || user.email,
        billingAddress: billingInfo.billingAddress || billingInfo.street || 'Non renseigné',
        billingCity: billingInfo.billingCity || billingInfo.city || 'Non renseigné',
        billingPostalCode: billingInfo.billingPostalCode || billingInfo.postalCode || '00000',
        billingCountry: billingInfo.billingCountry || billingInfo.country || 'France',
        siret: billingInfo.siret || null,
        vatNumber: billingInfo.vatNumber || null,
        userId: user.id
      }
    })

    // Créer le produit et le prix dans Stripe
    let stripePriceId: string

    try {
      // Chercher le prix existant par metadata (plus fiable)
      const prices = await stripe.prices.list({
        active: true,
        limit: 100
      })

      // Filtrer par metadata pour trouver le bon prix
      const existingPrice = prices.data.find(price => 
        price.metadata.planId === plan.id && 
        price.metadata.billingInterval === billingInterval
      )

      if (existingPrice) {
        stripePriceId = existingPrice.id
        console.log('[CHECKOUT] Prix existant trouvé:', stripePriceId)
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
        console.log('[CHECKOUT] Nouveau produit et prix créés:', product.id, price.id)
      }
    } catch (stripeError) {
      console.error('Erreur Stripe:', stripeError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du produit Stripe', details: stripeError.message },
        { status: 500 }
      )
    }

    // Créer ou mettre à jour l'abonnement dans notre base de données AVANT la session Stripe
    // Cela garantit que l'abonnement existe même si le webhook échoue
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 jours d'essai

    let dbSubscription

    if (existingSubscription && (existingSubscription.status === 'ACTIVE' || existingSubscription.status === 'TRIAL')) {
      // Si changement de plan, on met à jour l'abonnement existant
      console.log('[CHECKOUT] Mise à jour de l\'abonnement existant pour changement de plan')
      dbSubscription = await prisma.subscription.update({
        where: {
          id: existingSubscription.id
        },
        data: {
          planId: planId,
          status: 'TRIAL', // Redémarrer l'essai pour le nouveau plan
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialStart: now,
          trialEnd: trialEnd,
          cancelAtPeriodEnd: false,
          updatedAt: now
        },
        include: {
          plan: true
        }
      })
    } else {
      // Créer un nouvel abonnement ou mettre à jour un abonnement inactif
      dbSubscription = await prisma.subscription.upsert({
        where: {
          userId: user.id
        },
        update: {
          planId: planId,
          status: 'TRIAL',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialStart: now,
          trialEnd: trialEnd,
          cancelAtPeriodEnd: false,
          updatedAt: now
        },
        create: {
          userId: user.id,
          planId: planId,
          status: 'TRIAL',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialStart: now,
          trialEnd: trialEnd,
          cancelAtPeriodEnd: false
        },
        include: {
          plan: true
        }
      })
    }

    console.log('[CHECKOUT] Abonnement créé dans la base de données:', dbSubscription.id)

    // Créer la session de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/partner-dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/partner-dashboard/subscription?canceled=true`,
      subscription_data: {
        trial_period_days: 14, // 14 jours d'essai gratuit
        metadata: {
          userId: user.id,
          planId: plan.id,
          billingInterval: billingInterval,
          dbSubscriptionId: dbSubscription.id // Ajouter l'ID de l'abonnement DB
        }
      },
      metadata: {
        userId: user.id,
        planId: plan.id,
        billingInterval: billingInterval,
        dbSubscriptionId: dbSubscription.id // Ajouter l'ID de l'abonnement DB
      }
    })

    console.log('[CHECKOUT] Session de checkout créée:', checkoutSession.id)

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      subscription: dbSubscription // Retourner l'abonnement créé
    })
  } catch (error) {
    console.error('Erreur lors de la création de la session de checkout:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de checkout', details: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    console.error('Erreur de vérification de la signature webhook:', err)
    return NextResponse.json(
      { error: 'Signature invalide' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const userId = session.metadata?.userId
          const planId = session.metadata?.planId

          if (userId && planId) {
            // Créer l'abonnement dans notre base de données
            const subscription = await prisma.subscription.create({
              data: {
                userId: userId,
                planId: planId,
                status: 'TRIAL',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours d'essai
                trialStart: new Date(),
                trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                stripeSubscriptionId: subscriptionId
              }
            })

            console.log('Abonnement créé:', subscription.id)
          }
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const planId = subscription.metadata?.planId

        if (userId && planId) {
          // Mettre à jour l'abonnement existant ou en créer un nouveau
          await prisma.subscription.upsert({
            where: {
              stripeSubscriptionId: subscription.id
            },
            update: {
              status: subscription.status === 'active' ? 'ACTIVE' : 'TRIAL',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
            },
            create: {
              userId: userId,
              planId: planId,
              status: subscription.status === 'active' ? 'ACTIVE' : 'TRIAL',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
              stripeSubscriptionId: subscription.id
            }
          })

          console.log('Abonnement synchronisé:', subscription.id)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id
          },
          data: {
            status: subscription.status === 'active' ? 'ACTIVE' : 
                   subscription.status === 'canceled' ? 'CANCELLED' :
                   subscription.status === 'past_due' ? 'PAST_DUE' : 'UNPAID',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        })

        console.log('Abonnement mis à jour:', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id
          },
          data: {
            status: 'CANCELLED'
          }
        })

        console.log('Abonnement annulé:', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          // Créer un enregistrement de paiement
          await prisma.payment.create({
            data: {
              amount: invoice.amount_paid / 100, // Convertir de centimes en euros
              currency: invoice.currency.toUpperCase(),
              status: 'COMPLETED',
              description: `Paiement pour ${invoice.lines.data[0]?.description || 'Abonnement'}`,
              paidAt: new Date(),
              stripePaymentIntentId: invoice.payment_intent as string,
              stripeInvoiceId: invoice.id,
              subscriptionId: (await prisma.subscription.findFirst({
                where: { stripeSubscriptionId: invoice.subscription as string }
              }))?.id || ''
            }
          })

          console.log('Paiement enregistré:', invoice.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          // Mettre à jour le statut de l'abonnement
          await prisma.subscription.updateMany({
            where: {
              stripeSubscriptionId: invoice.subscription as string
            },
            data: {
              status: 'PAST_DUE'
            }
          })

          console.log('Échec de paiement:', invoice.id)
        }
        break
      }

      default:
        console.log(`Événement non géré: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  console.log('[WEBHOOK] Nouveau webhook reçu:', { 
    hasSignature: !!signature,
    bodyLength: body.length,
    timestamp: new Date().toISOString()
  })

  if (!signature) {
    console.error('[WEBHOOK] Signature manquante')
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
    console.log('[WEBHOOK] Événement validé:', event.type, event.id)
  } catch (err) {
    console.error('[WEBHOOK] Erreur de vérification de la signature:', err)
    return NextResponse.json(
      { error: 'Signature invalide' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('[WEBHOOK] Traitement checkout.session.completed')
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const userId = session.metadata?.userId
          const planId = session.metadata?.planId

          console.log('[WEBHOOK] Données de session:', { 
            subscriptionId, 
            userId, 
            planId,
            customerEmail: session.customer_details?.email 
          })

          if (userId && planId) {
            // Vérifier si l'abonnement existe déjà
            const existingSubscription = await prisma.subscription.findFirst({
              where: {
                OR: [
                  { stripeSubscriptionId: subscriptionId },
                  { userId: userId, status: { in: ['ACTIVE', 'TRIAL'] } }
                ]
              }
            })

            if (existingSubscription) {
              console.log('[WEBHOOK] Abonnement existant trouvé:', existingSubscription.id)
              // Mettre à jour l'abonnement existant
              await prisma.subscription.update({
                where: { id: existingSubscription.id },
                data: {
                  stripeSubscriptionId: subscriptionId,
                  status: 'TRIAL',
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                  trialStart: new Date(),
                  trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                }
              })
              console.log('[WEBHOOK] Abonnement mis à jour:', existingSubscription.id)
            } else {
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
              console.log('[WEBHOOK] Nouvel abonnement créé:', subscription.id)
            }
          } else {
            console.error('[WEBHOOK] Données manquantes dans la session:', { userId, planId })
          }
        }
        break
      }

      case 'customer.subscription.created': {
        console.log('[WEBHOOK] Traitement customer.subscription.created')
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const planId = subscription.metadata?.planId

        console.log('[WEBHOOK] Données de subscription:', { 
          subscriptionId: subscription.id,
          userId, 
          planId,
          status: subscription.status 
        })

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

          console.log('[WEBHOOK] Abonnement synchronisé:', subscription.id)
        }
        break
      }

      case 'customer.subscription.updated': {
        console.log('[WEBHOOK] Traitement customer.subscription.updated')
        const subscription = event.data.object as Stripe.Subscription
        
        const result = await prisma.subscription.updateMany({
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

        console.log('[WEBHOOK] Abonnement mis à jour:', subscription.id, 'Records updated:', result.count)
        break
      }

      case 'customer.subscription.deleted': {
        console.log('[WEBHOOK] Traitement customer.subscription.deleted')
        const subscription = event.data.object as Stripe.Subscription
        
        const result = await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id
          },
          data: {
            status: 'CANCELLED'
          }
        })

        console.log('[WEBHOOK] Abonnement annulé:', subscription.id, 'Records updated:', result.count)
        break
      }

      case 'invoice.payment_succeeded': {
        console.log('[WEBHOOK] Traitement invoice.payment_succeeded')
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          // Trouver l'abonnement correspondant
          const dbSubscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription as string }
          })

          if (dbSubscription) {
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
                subscriptionId: dbSubscription.id
              }
            })

            // Mettre à jour le statut de l'abonnement si c'était en période d'essai
            if (dbSubscription.status === 'TRIAL') {
              await prisma.subscription.update({
                where: { id: dbSubscription.id },
                data: { status: 'ACTIVE' }
              })
              console.log('[WEBHOOK] Abonnement activé après paiement:', dbSubscription.id)
            }

            console.log('[WEBHOOK] Paiement enregistré:', invoice.id)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        console.log('[WEBHOOK] Traitement invoice.payment_failed')
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const result = await prisma.subscription.updateMany({
            where: {
              stripeSubscriptionId: invoice.subscription as string
            },
            data: {
              status: 'PAST_DUE'
            }
          })

          console.log('[WEBHOOK] Échec de paiement:', invoice.id, 'Records updated:', result.count)
        }
        break
      }

      default:
        console.log('[WEBHOOK] Événement non géré:', event.type)
    }

    console.log('[WEBHOOK] Traitement terminé avec succès pour:', event.type)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[WEBHOOK] Erreur lors du traitement du webhook:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    )
  }
}

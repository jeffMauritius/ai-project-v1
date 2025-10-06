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
    const { cancelAtPeriodEnd = true } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Trouver l'abonnement actif
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['ACTIVE', 'TRIAL']
        }
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé' },
        { status: 404 }
      )
    }

    // Essayer de mettre à jour Stripe si possible, mais ne pas bloquer si ça échoue
    if (subscription.stripeSubscriptionId) {
      try {
        // Annuler l'abonnement dans Stripe
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: cancelAtPeriodEnd
        })
        console.log('[CANCEL] Abonnement Stripe mis à jour:', subscription.stripeSubscriptionId)
      } catch (stripeError) {
        console.warn('[CANCEL] Erreur Stripe (non bloquante):', stripeError.message)
        // On continue même si Stripe échoue - l'important c'est notre DB
      }
    } else {
      console.log('[CANCEL] Pas d\'ID Stripe, annulation locale uniquement')
    }

    // Mettre à jour l'abonnement dans notre base de données
    try {
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: cancelAtPeriodEnd,
          status: cancelAtPeriodEnd ? 'CANCELLED' : 'ACTIVE'
        },
        include: {
          plan: true
        }
      })

      console.log('[CANCEL] Abonnement mis à jour dans la DB:', updatedSubscription.id)
      
      return NextResponse.json({
        subscription: updatedSubscription,
        message: cancelAtPeriodEnd 
          ? 'Votre abonnement sera annulé à la fin de la période actuelle'
          : 'Annulation de l\'abonnement annulée'
      })
    } catch (dbError) {
      console.error('[CANCEL] Erreur base de données:', dbError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'abonnement' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de l\'abonnement' },
      { status: 500 }
    )
  }
}

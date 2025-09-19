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

    if (subscription.stripeSubscriptionId) {
      // Annuler l'abonnement dans Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      })
    }

    // Mettre à jour l'abonnement dans notre base de données
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: cancelAtPeriodEnd
      },
      include: {
        plan: true
      }
    })

    return NextResponse.json({
      subscription: updatedSubscription
    })
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de l\'abonnement' },
      { status: 500 }
    )
  }
}

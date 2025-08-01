import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    // Mettre à jour l'abonnement
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? subscription.status : 'CANCELLED'
      },
      include: {
        plan: true
      }
    })

    return NextResponse.json({
      subscription: updatedSubscription,
      message: cancelAtPeriodEnd 
        ? 'L\'abonnement sera annulé à la fin de la période actuelle'
        : 'L\'abonnement a été annulé immédiatement'
    })
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de l\'abonnement' },
      { status: 500 }
    )
  }
} 
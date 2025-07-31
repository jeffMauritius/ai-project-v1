import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Récupérer l'abonnement actuel de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['ACTIVE', 'TRIAL']
            }
          },
          include: {
            plan: true,
            payments: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 10
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        billingInfo: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const currentSubscription = user.subscriptions[0] || null

    return NextResponse.json({
      subscription: currentSubscription,
      billingInfo: user.billingInfo
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'abonnement' },
      { status: 500 }
    )
  }
}

// Créer un nouvel abonnement
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

    // Calculer les dates de période
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 jours d'essai

    // Créer l'abonnement
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: planId,
        status: 'TRIAL',
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd: trialEnd
      },
      include: {
        plan: true
      }
    })

    return NextResponse.json({
      subscription,
      billingInfo: billingInfoData
    })
  } catch (error) {
    console.error('Erreur lors de la création de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'abonnement' },
      { status: 500 }
    )
  }
} 
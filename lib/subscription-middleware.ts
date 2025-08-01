import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface SubscriptionCheck {
  hasActiveSubscription: boolean
  subscription: any
  canUploadPhotos: boolean
  photoCount: number
  maxPhotos: number | null
  isTrial: boolean
  isExpired: boolean
}

export async function checkSubscription(userId: string): Promise<SubscriptionCheck> {
  try {
    // Récupérer l'abonnement actif
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'TRIAL']
        }
      },
      include: {
        plan: true
      }
    })

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        canUploadPhotos: false,
        photoCount: 0,
        maxPhotos: 0,
        isTrial: false,
        isExpired: true
      }
    }

    // Vérifier si l'abonnement est expiré
    const now = new Date()
    const isExpired = subscription.currentPeriodEnd < now

    // Compter les photos existantes
    const photoCount = await prisma.media.count({
      where: {
        storefront: {
          userId
        },
        type: 'IMAGE'
      }
    })

    // Vérifier les limites de photos
    const maxPhotos = subscription.plan.maxPhotos
    const canUploadPhotos = maxPhotos === null || photoCount < maxPhotos

    return {
      hasActiveSubscription: true,
      subscription,
      canUploadPhotos,
      photoCount,
      maxPhotos,
      isTrial: subscription.status === 'TRIAL',
      isExpired
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'abonnement:', error)
    return {
      hasActiveSubscription: false,
      subscription: null,
      canUploadPhotos: false,
      photoCount: 0,
      maxPhotos: 0,
      isTrial: false,
      isExpired: true
    }
  }
}

export async function requireActiveSubscription(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
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

  const subscriptionCheck = await checkSubscription(user.id)

  if (!subscriptionCheck.hasActiveSubscription || subscriptionCheck.isExpired) {
    return NextResponse.json(
      { 
        error: 'Abonnement requis',
        subscriptionRequired: true,
        redirectTo: '/partner-dashboard/subscription'
      },
      { status: 403 }
    )
  }

  return subscriptionCheck
}

export async function requirePhotoUploadPermission(request: NextRequest) {
  const subscriptionCheck = await requireActiveSubscription(request)
  
  if (subscriptionCheck instanceof NextResponse) {
    return subscriptionCheck
  }

  if (!subscriptionCheck.canUploadPhotos) {
    return NextResponse.json(
      { 
        error: 'Limite de photos atteinte',
        photoLimitReached: true,
        currentCount: subscriptionCheck.photoCount,
        maxPhotos: subscriptionCheck.maxPhotos,
        redirectTo: '/partner-dashboard/subscription'
      },
      { status: 403 }
    )
  }

  return subscriptionCheck
} 
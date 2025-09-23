import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { billingInfo } = body

    if (!billingInfo) {
      return NextResponse.json(
        { error: 'Informations de facturation manquantes' },
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

    // Mettre à jour les informations de facturation
    const updatedBillingInfo = await prisma.billingInfo.upsert({
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

    // Si l'utilisateur a un customer Stripe, mettre à jour les informations
    if (user.stripeCustomerId) {
      await stripe.customers.update(user.stripeCustomerId, {
        name: billingInfo.billingName,
        email: billingInfo.billingEmail,
        address: {
          line1: billingInfo.billingAddress,
          city: billingInfo.billingCity,
          postal_code: billingInfo.billingPostalCode,
          country: billingInfo.billingCountry
        }
      })
    }

    return NextResponse.json({
      billingInfo: updatedBillingInfo
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations de facturation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des informations de facturation' },
      { status: 500 }
    )
  }
}

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur a déjà un customer Stripe
    if (user.stripeCustomerId) {
      return NextResponse.json({
        customerId: user.stripeCustomerId
      })
    }

    // Créer un customer Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: user.id
      }
    })

    // Mettre à jour l'utilisateur avec l'ID du customer Stripe
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id }
    })

    return NextResponse.json({
      customerId: customer.id
    })
  } catch (error) {
    console.error('Erreur lors de la création du customer Stripe:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du customer' },
      { status: 500 }
    )
  }
}

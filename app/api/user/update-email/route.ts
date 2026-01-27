import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'L\'email est obligatoire' },
        { status: 400 }
      )
    }

    // Valider le format de l'email (regex améliorée)
    // Requiert au minimum: local@domain.tld (tld >= 2 caractères)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Normaliser l'email
    const normalizedEmail = email.toLowerCase().trim()

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: session.user.id }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé par un autre compte' },
        { status: 409 }
      )
    }

    // Log pour audit de sécurité
    console.log('[SECURITY] Email update:', { userId: session.user.id, newEmail: normalizedEmail })

    // Mettre à jour l'email de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: normalizedEmail,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    })

    return NextResponse.json({
      message: 'Email mis à jour avec succès',
      user: updatedUser
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de l\'email' },
      { status: 500 }
    )
  }
}

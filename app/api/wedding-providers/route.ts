import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer tous les prestataires de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const providers = await prisma.weddingProvider.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Erreur lors de la récupération des prestataires:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des prestataires' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau prestataire
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, date, status, price, deposit, notes } = body

    // Validation des champs obligatoires
    if (!name || !type || !date || !status || !price) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    const provider = await prisma.weddingProvider.create({
      data: {
        name,
        type,
        date,
        status,
        price,
        deposit: deposit || '0',
        notes: notes || '',
        userId: session.user.id
      }
    })

    return NextResponse.json(provider, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du prestataire:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du prestataire' },
      { status: 500 }
    )
  }
}

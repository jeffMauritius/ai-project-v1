import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer toutes les tables d'un utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const tables = await prisma.table.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tables)
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle table
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, seats } = body

    // Validation des données
    if (!name || !seats) {
      return NextResponse.json(
        { error: 'Le nom et le nombre de places sont requis' },
        { status: 400 }
      )
    }

    if (seats < 1 || seats > 20) {
      return NextResponse.json(
        { error: 'Le nombre de places doit être entre 1 et 20' },
        { status: 400 }
      )
    }

    // Créer la table
    const table = await prisma.table.create({
      data: {
        name: name.trim(),
        seats: parseInt(seats),
        guests: [],
        userId: session.user.id
      }
    })

    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la table:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 
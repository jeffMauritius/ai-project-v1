import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer une table spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const table = await prisma.table.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!table) {
      return NextResponse.json({ error: 'Table non trouvée' }, { status: 404 })
    }

    return NextResponse.json(table)
  } catch (error) {
    console.error('Erreur lors de la récupération de la table:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour une table
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, seats, guests } = body

    // Vérifier que la table existe et appartient à l'utilisateur
    const existingTable = await prisma.table.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingTable) {
      return NextResponse.json({ error: 'Table non trouvée' }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    
    if (seats !== undefined) {
      if (seats < 1 || seats > 20) {
        return NextResponse.json(
          { error: 'Le nombre de places doit être entre 1 et 20' },
          { status: 400 }
        )
      }
      updateData.seats = parseInt(seats)
    }
    
    if (guests !== undefined) {
      updateData.guests = guests
    }

    // Mettre à jour la table
    const updatedTable = await prisma.table.update({
      where: {
        id: params.id
      },
      data: updateData
    })

    return NextResponse.json(updatedTable)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la table:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une table
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que la table existe et appartient à l'utilisateur
    const existingTable = await prisma.table.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingTable) {
      return NextResponse.json({ error: 'Table non trouvée' }, { status: 404 })
    }

    // Supprimer la table
    await prisma.table.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Table supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la table:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 
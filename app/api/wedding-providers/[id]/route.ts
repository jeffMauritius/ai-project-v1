import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Supprimer un prestataire
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params

    // Vérifier que le prestataire appartient à l'utilisateur
    const provider = await prisma.weddingProvider.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Prestataire non trouvé' },
        { status: 404 }
      )
    }

    await prisma.weddingProvider.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Prestataire supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du prestataire:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression du prestataire' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un prestataire
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, type, date, status, price, deposit, notes } = body

    // Vérifier que le prestataire appartient à l'utilisateur
    const existingProvider = await prisma.weddingProvider.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Prestataire non trouvé' },
        { status: 404 }
      )
    }

    const provider = await prisma.weddingProvider.update({
      where: { id },
      data: {
        name,
        type,
        date,
        status,
        price,
        deposit: deposit || '0',
        notes: notes || ''
      }
    })

    return NextResponse.json(provider)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du prestataire:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du prestataire' },
      { status: 500 }
    )
  }
}

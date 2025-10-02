import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/guest-groups - Récupérer les groupes d'invités de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guestGroups = await prisma.guestGroup.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        guests: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(guestGroups)
  } catch (error) {
    console.error('Error fetching guest groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/guest-groups - Créer un nouveau groupe d'invités
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, type, count, confirmed = false, notes = '' } = await request.json()

    if (!name || !type || !count) {
      return NextResponse.json({ error: 'Missing required fields: name, type, count' }, { status: 400 })
    }

    // Vérifier si un groupe avec ce nom existe déjà pour cet utilisateur
    const existingGroup = await prisma.guestGroup.findFirst({
      where: {
        name: name.trim(),
        userId: session.user.id
      }
    })

    if (existingGroup) {
      return NextResponse.json({ 
        error: 'Un groupe avec ce nom existe déjà' 
      }, { status: 409 })
    }

    const guestGroup = await prisma.guestGroup.create({
      data: {
        name: name.trim(),
        type,
        count,
        confirmed,
        notes,
        userId: session.user.id
      },
      include: {
        guests: true
      }
    })

    return NextResponse.json(guestGroup)
  } catch (error) {
    console.error('Error creating guest group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

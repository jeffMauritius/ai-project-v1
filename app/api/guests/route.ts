import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/guests - Récupérer les invités de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guests = await prisma.guest.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        group: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(guests)
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/guests - Créer un nouvel invité
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, email, groupId, status = 'pending' } = await request.json()

    if (!firstName || !lastName || !email || !groupId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const guest = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        email,
        status,
        userId: session.user.id,
        groupId
      }
    })

    return NextResponse.json(guest)
  } catch (error) {
    console.error('Error creating guest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
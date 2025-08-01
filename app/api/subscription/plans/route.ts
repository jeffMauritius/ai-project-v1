import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        price: 'asc'
      }
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Erreur lors de la récupération des plans:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des plans' },
      { status: 500 }
    )
  }
} 
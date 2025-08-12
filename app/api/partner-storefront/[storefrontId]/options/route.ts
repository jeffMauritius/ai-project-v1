import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storefrontId: string }> }
) {
  try {
    const { storefrontId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le storefront avec le partenaire associé
    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        id: storefrontId,
        partner: {
          userId: session.user.id
        }
      },
      include: {
        partner: true
      }
    })

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront non trouvé' }, { status: 404 })
    }

    // Retourner les options du partenaire
    return NextResponse.json({
      id: storefront.id,
      type: storefront.type,
      isActive: storefront.isActive,
      logo: storefront.logo,
      partner: storefront.partner
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des options:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storefrontId: string }> }
) {
  try {
    const { storefrontId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { options, searchableOptions } = body

    // Vérifier que l'utilisateur possède ce storefront
    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        id: storefrontId,
        partner: {
          userId: session.user.id
        }
      },
      include: {
        partner: true
      }
    })

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront non trouvé' }, { status: 404 })
    }

    // Mettre à jour le partenaire avec les nouvelles options
    const updatedPartner = await prisma.partner.update({
      where: { id: storefront.partner!.id },
      data: {
        options: options,
        searchableOptions: searchableOptions
      }
    })

    // Mettre à jour le storefront
    const updatedStorefront = await prisma.partnerStorefront.update({
      where: { id: storefrontId },
      data: {
        isActive: true
      }
    })

    return NextResponse.json({
      id: updatedStorefront.id,
      type: updatedStorefront.type,
      isActive: updatedStorefront.isActive,
      logo: updatedStorefront.logo,
      partner: updatedPartner
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des options:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 
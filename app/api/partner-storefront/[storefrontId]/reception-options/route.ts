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

    // Récupérer le storefront avec l'établissement associé
    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        id: storefrontId,
        establishment: {
          // Vérifier que l'utilisateur possède cet établissement
          // (à adapter selon votre logique de propriété)
        }
      },
      include: {
        establishment: true
      }
    })

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront non trouvé' }, { status: 404 })
    }

    // Récupérer les espaces de réception de l'établissement
    const spaces = await prisma.receptionSpace.findMany({
      where: {
        establishmentId: storefront.establishmentId!
      }
    })

    // Récupérer les options de réception de l'établissement
    const options = await prisma.receptionOptions.findUnique({
      where: {
        establishmentId: storefront.establishmentId!
      }
    })

    return NextResponse.json({
      id: storefront.id,
      type: storefront.type,
      isActive: storefront.isActive,
      logo: storefront.logo,
      spaces: spaces,
      options: options
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des options de réception:', error)
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
    const { spaces, options } = body

    // Vérifier que l'utilisateur possède ce storefront
    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        id: storefrontId,
        establishment: {
          // Vérifier que l'utilisateur possède cet établissement
          // (à adapter selon votre logique de propriété)
        }
      }
    })

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront non trouvé' }, { status: 404 })
    }

    // Mettre à jour ou créer les espaces de réception
    if (spaces && Array.isArray(spaces)) {
      for (const space of spaces) {
        if (space.id) {
          await prisma.receptionSpace.update({
            where: { id: space.id },
            data: {
              name: space.name,
              description: space.description,
              surface: space.surface,
              seatedCapacity: space.seatedCapacity,
              standingCapacity: space.standingCapacity,
              hasDanceFloor: space.hasDanceFloor,
              hasPmrAccess: space.hasPmrAccess,
              hasPrivateOutdoor: space.hasPrivateOutdoor
            }
          })
        } else {
          await prisma.receptionSpace.create({
            data: {
              name: space.name,
              description: space.description,
              surface: space.surface,
              seatedCapacity: space.seatedCapacity,
              standingCapacity: space.standingCapacity,
              hasDanceFloor: space.hasDanceFloor,
              hasPmrAccess: space.hasPmrAccess,
              hasPrivateOutdoor: space.hasPrivateOutdoor,
              establishmentId: storefront.establishmentId!
            }
          })
        }
      }
    }

    // Mettre à jour ou créer les options de réception
    if (options) {
      await prisma.receptionOptions.upsert({
        where: {
          establishmentId: storefront.establishmentId!
        },
        update: options,
        create: {
          ...options,
          establishmentId: storefront.establishmentId!
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des options de réception:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 
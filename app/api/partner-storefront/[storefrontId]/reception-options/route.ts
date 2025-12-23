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

    console.log('[reception-options PUT] storefrontId:', storefrontId)
    console.log('[reception-options PUT] body:', JSON.stringify({ spaces, options }, null, 2))

    // Vérifier que l'utilisateur possède ce storefront
    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        id: storefrontId
      },
      include: {
        establishment: true
      }
    })

    console.log('[reception-options PUT] storefront trouvé:', storefront?.id, 'establishmentId:', storefront?.establishmentId)

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront non trouvé' }, { status: 404 })
    }

    if (!storefront.establishmentId) {
      console.error('[reception-options PUT] Pas d\'establishmentId pour ce storefront')
      return NextResponse.json({ error: 'Ce storefront n\'est pas lié à un établissement' }, { status: 400 })
    }

    // Mettre à jour ou créer les espaces de réception
    if (spaces && Array.isArray(spaces)) {
      // Récupérer les espaces existants pour cette établissement
      const existingSpaces = await prisma.receptionSpace.findMany({
        where: { establishmentId: storefront.establishmentId! }
      })
      const existingIds = existingSpaces.map(s => s.id)

      for (const space of spaces) {
        const spaceData = {
          name: space.name || '',
          description: space.description || '',
          surface: space.surface || 0,
          seatedCapacity: space.seatedCapacity || 0,
          standingCapacity: space.standingCapacity || 0,
          hasDanceFloor: space.hasDanceFloor || false,
          hasPmrAccess: space.hasPmrAccess || false,
          hasPrivateOutdoor: space.hasPrivateOutdoor || false
        }

        // Vérifier si l'ID existe vraiment dans la base de données (ObjectId MongoDB valide)
        const isExistingSpace = space.id && existingIds.includes(space.id)

        if (isExistingSpace) {
          await prisma.receptionSpace.update({
            where: { id: space.id },
            data: spaceData
          })
        } else {
          await prisma.receptionSpace.create({
            data: {
              ...spaceData,
              establishmentId: storefront.establishmentId!
            }
          })
        }
      }

      // Supprimer les espaces qui ne sont plus dans la liste
      const newSpaceIds = spaces.filter(s => existingIds.includes(s.id)).map(s => s.id)
      const spacesToDelete = existingIds.filter(id => !newSpaceIds.includes(id))
      if (spacesToDelete.length > 0) {
        await prisma.receptionSpace.deleteMany({
          where: { id: { in: spacesToDelete } }
        })
      }
    }

    // Mettre à jour ou créer les options de réception
    if (options) {
      // Mapper les champs pour correspondre au schéma Prisma
      const optionsData = {
        rentalDuration: options.rentalDuration || '',
        price: options.price || 0,
        accommodationType: options.accommodationType || '',
        numberOfRooms: options.numberOfRooms || 0,
        numberOfBeds: options.numberOfBeds || 0,
        hasMandatoryCaterer: options.hasMandatoryCaterer || false,
        providesCatering: options.providesCatering || false,
        allowsOwnDrinks: options.allowsOwnDrinks || false,
        hasCorkageFee: options.hasCorkageFee || false,
        corkageFee: options.corkageFee || 0,
        hasTimeLimit: options.hasTimeLimit || false,
        timeLimit: options.timeLimit || null,
        hasMandatoryPhotographer: options.hasMandatoryPhotographer || false,
        hasMusicExclusivity: options.hasMusicExclusivity || false,
        additionalServices: options.additionalServices || null,
        includesCleaning: options.includesCleaning || false,
        allowsPets: options.allowsPets || false,
        allowsMultipleEvents: options.allowsMultipleEvents || false,
        hasSecurityGuard: options.hasSecurityGuard || false,
      }

      await prisma.receptionOptions.upsert({
        where: {
          establishmentId: storefront.establishmentId!
        },
        update: optionsData,
        create: {
          ...optionsData,
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
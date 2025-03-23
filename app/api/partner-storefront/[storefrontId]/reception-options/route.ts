import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const receptionSpaceSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().min(1, 'La description est requise'),
  surface: z.number().min(0, 'La surface doit être positive'),
  seatedCapacity: z.number().int().min(0, 'La capacité assise doit être positive'),
  standingCapacity: z.number().int().min(0, 'La capacité debout doit être positive'),
  hasDanceFloor: z.boolean(),
  hasPmrAccess: z.boolean(),
  hasPrivateOutdoor: z.boolean(),
})

const receptionOptionsSchema = z.object({
  rentalDuration: z.string().min(1, 'La durée de location est requise'),
  price: z.number().min(0, 'Le prix doit être positif'),
  accommodationType: z.string().min(1, 'Le type d\'hébergement est requis'),
  numberOfRooms: z.number().int().min(0, 'Le nombre de chambres doit être positif'),
  numberOfBeds: z.number().int().min(0, 'Le nombre de lits doit être positif'),
  hasMandatoryCaterer: z.boolean(),
  providesCatering: z.boolean(),
  allowsOwnDrinks: z.boolean(),
  hasCorkageFee: z.boolean(),
  corkageFee: z.number().min(0, 'Le droit de bouchon doit être positif'),
  hasTimeLimit: z.boolean(),
  timeLimit: z.string().optional(),
  hasMandatoryPhotographer: z.boolean(),
  hasMusicExclusivity: z.boolean(),
  additionalServices: z.string().optional(),
  includesCleaning: z.boolean(),
  allowsPets: z.boolean(),
  allowsMultipleEvents: z.boolean(),
  hasSecurityGuard: z.boolean(),
})

const requestSchema = z.object({
  spaces: z.array(receptionSpaceSchema),
  options: receptionOptionsSchema,
})

export async function GET(
  request: Request,
  { params }: { params: { storefrontId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Non autorisé', { status: 401 })
    }

    const storefront = await prisma.partnerStorefront.findUnique({
      where: {
        id: params.storefrontId,
        userId: session.user.id,
      },
      include: {
        receptionSpaces: true,
        receptionOptions: true,
      },
    })

    if (!storefront) {
      return new NextResponse('Storefront non trouvé', { status: 404 })
    }

    return NextResponse.json({
      spaces: storefront.receptionSpaces,
      options: storefront.receptionOptions,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des options:', error)
    return new NextResponse('Erreur interne', { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { storefrontId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Non autorisé', { status: 401 })
    }

    const storefront = await prisma.partnerStorefront.findUnique({
      where: {
        id: params.storefrontId,
        userId: session.user.id,
      },
    })

    if (!storefront) {
      return new NextResponse('Storefront non trouvé', { status: 404 })
    }

    const body = await request.json()
    
    // Valider les données
    const validatedData = requestSchema.parse(body)
    const { spaces, options } = validatedData

    // Supprimer les anciens espaces
    await prisma.receptionSpace.deleteMany({
      where: {
        storefrontId: params.storefrontId,
      },
    })

    // Créer les nouveaux espaces
    const createdSpaces = await Promise.all(
      spaces.map((space) =>
        prisma.receptionSpace.create({
          data: {
            ...space,
            storefrontId: params.storefrontId,
          },
        })
      )
    )

    // Mettre à jour ou créer les options
    const updatedOptions = await prisma.receptionOptions.upsert({
      where: {
        storefrontId: params.storefrontId,
      },
      update: options,
      create: {
        ...options,
        storefrontId: params.storefrontId,
      },
    })

    return NextResponse.json({
      spaces: createdSpaces,
      options: updatedOptions,
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des options:', error)
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    return new NextResponse('Erreur interne', { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OptionsService } from '@/lib/options-service'
import { z } from 'zod'

const optionsRequestSchema = z.object({
  providerType: z.string(),
  formData: z.record(z.any()),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storefrontId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Non autorisé', { status: 401 })
    }

    const { storefrontId } = await params;
    const storefront = await prisma.partnerStorefront.findUnique({
      where: {
        id: storefrontId,
        userId: session.user.id,
      },
    })

    if (!storefront) {
      return new NextResponse('Storefront non trouvé', { status: 404 })
    }

    return NextResponse.json({
      options: storefront.options,
      searchableOptions: storefront.searchableOptions,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des options:', error)
    return new NextResponse('Erreur interne', { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storefrontId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Non autorisé', { status: 401 })
    }

    const { storefrontId } = await params;
    const storefront = await prisma.partnerStorefront.findUnique({
      where: {
        id: storefrontId,
        userId: session.user.id,
      },
    })

    if (!storefront) {
      return new NextResponse('Storefront non trouvé', { status: 404 })
    }

    const body = await request.json()
    const validatedData = optionsRequestSchema.parse(body)
    const { providerType, formData } = validatedData

    // Sauvegarder les options avec génération automatique des searchableOptions
    const { options, searchableOptions } = await OptionsService.saveOptions(
      storefrontId,
      storefront.serviceType,
      formData
    )

    // Mettre à jour le storefront avec les nouvelles options
    const updatedStorefront = await prisma.partnerStorefront.update({
      where: {
        id: storefrontId,
      },
      data: {
        options: options,
        searchableOptions: searchableOptions,
      },
    })

    return NextResponse.json({
      options: updatedStorefront.options,
      searchableOptions: updatedStorefront.searchableOptions,
    })
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des options:', error)
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    return new NextResponse('Erreur interne', { status: 500 })
  }
} 
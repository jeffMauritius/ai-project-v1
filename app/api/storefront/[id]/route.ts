import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return new NextResponse('ID manquant', { status: 400 })
    }

    const storefront = await prisma.partnerStorefront.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { order: 'asc' }
        },
        establishment: true,
        partner: true
      }
    })

    if (!storefront) {
      return new NextResponse('Storefront non trouvé', { status: 404 })
    }

    return NextResponse.json(storefront)
  } catch (error) {
    console.error('[STOREFRONT_GET] Erreur:', error)
    return new NextResponse('Erreur interne', { status: 500 })
  }
} 
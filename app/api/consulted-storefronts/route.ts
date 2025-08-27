import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer les vitrines consultées par l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    console.log(`[CONSULTED_STOREFRONTS_GET] Récupération pour utilisateur: ${session.user.id}`)
    
    const consultedStorefronts = await prisma.consultedStorefront.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    console.log(`[CONSULTED_STOREFRONTS_GET] ${consultedStorefronts.length} vitrines trouvées:`)
    consultedStorefronts.forEach((storefront, index) => {
      console.log(`  ${index + 1}. ${storefront.name} - ${storefront.status}`)
    })

    const response = NextResponse.json(consultedStorefronts)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error) {
    console.error("[CONSULTED_STOREFRONTS_GET] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
}

// POST - Marquer une vitrine comme consultée
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { storefrontId, name, type, serviceType } = body

    if (!storefrontId || !name || !type) {
      return new NextResponse("ID, nom et type de vitrine requis", { status: 400 })
    }

    // Vérifier si la vitrine a déjà été consultée par cet utilisateur
    const existingConsultation = await prisma.consultedStorefront.findFirst({
      where: {
        userId: session.user.id,
        storefrontId: storefrontId
      }
    })

    if (existingConsultation) {
      // Mettre à jour la date de consultation
      const updatedConsultation = await prisma.consultedStorefront.update({
        where: { id: existingConsultation.id },
        data: {
          updatedAt: new Date()
        }
      })
      return NextResponse.json(updatedConsultation)
    }

    // Créer une nouvelle consultation
    const consultation = await prisma.consultedStorefront.create({
      data: {
        storefrontId,
        name,
        type,
        serviceType,
        userId: session.user.id
      }
    })

    return NextResponse.json(consultation)
  } catch (error) {
    console.error("[CONSULTED_STOREFRONTS_POST] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 
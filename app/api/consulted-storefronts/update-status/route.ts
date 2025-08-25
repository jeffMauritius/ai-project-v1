import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Mettre à jour le statut d'une vitrine consultée
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await request.json()
    const { storefrontId, name, action } = body

    if (!storefrontId || !name || !action) {
      return new NextResponse("ID, nom et action requis", { status: 400 })
    }

    console.log(`[UPDATE_STATUS] Recherche consultation pour storefrontId: ${storefrontId}, action: ${action}`)
    
    // Trouver la vitrine consultée
    let consultation = await prisma.consultedStorefront.findFirst({
      where: {
        userId: session.user.id,
        storefrontId: storefrontId
      }
    })

    console.log(`[UPDATE_STATUS] Consultation trouvée:`, consultation ? { id: consultation.id, status: consultation.status } : 'Non trouvée')

    // Si la consultation n'existe pas et qu'on ajoute aux favoris, la créer
    if (!consultation && action === 'add') {
      console.log(`[UPDATE_STATUS] Création d'une nouvelle consultation pour storefrontId: ${storefrontId}`)
      consultation = await prisma.consultedStorefront.create({
        data: {
          storefrontId: storefrontId,
          name: name,
          type: 'PARTNER', // Par défaut, on peut ajuster selon le contexte
          serviceType: 'Prestataire',
          status: 'SAVED',
          userId: session.user.id
        }
      })
      console.log(`[UPDATE_STATUS] Nouvelle consultation créée avec statut: ${consultation.status}`)
    } else if (!consultation) {
      console.log(`[UPDATE_STATUS] Consultation non trouvée et action n'est pas 'add'`)
      return new NextResponse("Vitrine consultée non trouvée", { status: 404 })
    }

    // Mettre à jour le statut selon l'action
    let newStatus = consultation.status
    if (action === 'add') {
      newStatus = 'SAVED'
    } else if (action === 'remove') {
      newStatus = 'CONSULTED'
    }

    console.log(`[UPDATE_STATUS] Mise à jour du statut: ${consultation.status} → ${newStatus}`)

    // Mettre à jour la consultation
    const updatedConsultation = await prisma.consultedStorefront.update({
      where: { id: consultation.id },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    })

    console.log(`[UPDATE_STATUS] Consultation mise à jour avec succès:`, { id: updatedConsultation.id, status: updatedConsultation.status })
    return NextResponse.json(updatedConsultation)
  } catch (error) {
    console.error("[CONSULTED_STOREFRONTS_UPDATE_STATUS] Erreur:", error)
    return new NextResponse("Erreur interne du serveur", { status: 500 })
  }
} 
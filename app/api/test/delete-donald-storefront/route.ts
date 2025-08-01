import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  try {
    console.log("[DELETE_DONALD_STOREFRONT] Recherche de l'utilisateur Donald Duck")
    
    // Rechercher l'utilisateur Donald Duck
    const donaldUser = await prisma.user.findFirst({
      where: {
        name: {
          contains: "Donald",
          mode: 'insensitive'
        }
      },
      include: {
        storefront: true
      }
    })

    if (!donaldUser) {
      console.log("[DELETE_DONALD_STOREFRONT] Utilisateur Donald Duck non trouvé")
      return NextResponse.json({ message: "Utilisateur Donald Duck non trouvé" }, { status: 404 })
    }

    console.log("[DELETE_DONALD_STOREFRONT] Utilisateur trouvé:", donaldUser.email)

    if (!donaldUser.storefront) {
      console.log("[DELETE_DONALD_STOREFRONT] Aucune vitrine trouvée pour Donald Duck")
      return NextResponse.json({ message: "Aucune vitrine trouvée pour Donald Duck" }, { status: 404 })
    }

    console.log("[DELETE_DONALD_STOREFRONT] Suppression de la vitrine:", donaldUser.storefront.companyName)

    // Supprimer la vitrine (les relations Media, ReceptionSpace, ReceptionOptions seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.partnerStorefront.delete({
      where: {
        id: donaldUser.storefront.id
      }
    })

    console.log("[DELETE_DONALD_STOREFRONT] Vitrine supprimée avec succès")
    
    return NextResponse.json({ 
      message: "Vitrine de Donald Duck supprimée avec succès",
      deletedStorefront: {
        companyName: donaldUser.storefront.companyName,
        serviceType: donaldUser.storefront.serviceType
      }
    })
  } catch (error: any) {
    console.error("[DELETE_DONALD_STOREFRONT] Erreur détaillée:", error)
    return new NextResponse(`Erreur lors de la suppression: ${error.message}`, { status: 500 })
  }
} 
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log("[USER_DELETE_ACCOUNT] Utilisateur non authentifié")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    // Récupérer le corps de la requête pour vérifier l'email
    const body = await request.json()
    const { email } = body

    if (!email) {
      console.log("[USER_DELETE_ACCOUNT] Email manquant")
      return new NextResponse("Email requis pour la confirmation", { status: 400 })
    }

    console.log("[USER_DELETE_ACCOUNT] Début de la suppression du compte pour l'utilisateur:", session.user.id)

    // Récupérer l'utilisateur pour vérifier l'email
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    if (!user) {
      console.log("[USER_DELETE_ACCOUNT] Utilisateur non trouvé")
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    // Vérifier que l'email correspond
    if (user.email !== email) {
      console.log("[USER_DELETE_ACCOUNT] Email incorrect")
      return new NextResponse("Email incorrect", { status: 400 })
    }

    console.log("[USER_DELETE_ACCOUNT] Email vérifié, suppression de toutes les données")

    // Supprimer l'utilisateur (cela supprimera automatiquement toutes les données liées grâce aux relations)
    // Les relations avec onDelete: Cascade dans le schéma s'occuperont de la suppression en cascade
    await prisma.user.delete({
      where: {
        id: session.user.id,
      },
    })

    console.log("[USER_DELETE_ACCOUNT] Compte et toutes les données supprimés avec succès")

    return NextResponse.json({ 
      success: true, 
      message: "Compte supprimé avec succès"
    })
  } catch (error: any) {
    console.error("[USER_DELETE_ACCOUNT] Erreur détaillée:", error)
    console.error("[USER_DELETE_ACCOUNT] Stack trace:", error.stack)
    return new NextResponse(`Erreur interne: ${error.message || 'Erreur inconnue'}`, { status: 500 })
  }
} 
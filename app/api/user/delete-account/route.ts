import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as argon2 from "argon2"

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("[USER_DELETE_ACCOUNT] Utilisateur non authentifié")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    // Récupérer le corps de la requête pour vérifier l'email ET le mot de passe
    const body = await request.json()
    const { email, password } = body

    if (!email) {
      console.log("[USER_DELETE_ACCOUNT] Email manquant")
      return new NextResponse("Email requis pour la confirmation", { status: 400 })
    }

    if (!password) {
      console.log("[USER_DELETE_ACCOUNT] Mot de passe manquant")
      return new NextResponse("Mot de passe requis pour la confirmation", { status: 400 })
    }

    console.log("[USER_DELETE_ACCOUNT] Début de la suppression du compte pour l'utilisateur:", session.user.id)

    // Récupérer l'utilisateur pour vérifier l'email et le mot de passe
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

    // Vérifier le mot de passe (sécurité renforcée)
    if (!user.password) {
      // Utilisateur OAuth - ne peut pas supprimer avec mot de passe
      console.log("[USER_DELETE_ACCOUNT] Utilisateur OAuth sans mot de passe")
      return new NextResponse("Veuillez contacter le support pour supprimer votre compte", { status: 400 })
    }

    try {
      const isPasswordValid = await argon2.verify(user.password, password)
      if (!isPasswordValid) {
        console.log("[USER_DELETE_ACCOUNT] Mot de passe incorrect")
        // Log pour monitoring de sécurité
        console.warn("[SECURITY] Failed account deletion attempt - wrong password:", { userId: session.user.id })
        return new NextResponse("Mot de passe incorrect", { status: 400 })
      }
    } catch (verifyError) {
      console.error("[USER_DELETE_ACCOUNT] Erreur vérification mot de passe:", verifyError)
      return new NextResponse("Erreur de vérification", { status: 500 })
    }

    console.log("[USER_DELETE_ACCOUNT] Email et mot de passe vérifiés, suppression de toutes les données")

    // Log de sécurité pour audit
    console.log("[SECURITY] Account deletion confirmed:", { userId: session.user.id, email: user.email })

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
  } catch (error: unknown) {
    // Log l'erreur complète côté serveur uniquement
    console.error("[USER_DELETE_ACCOUNT] Erreur détaillée:", error)
    // Ne pas exposer les détails de l'erreur au client
    return new NextResponse("Une erreur est survenue lors de la suppression du compte", { status: 500 })
  }
} 
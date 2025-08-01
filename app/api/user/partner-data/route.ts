import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    // Récupérer l'utilisateur avec sa vitrine
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        storefront: true
      }
    })

    if (!user) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 })
    }

    if (user.role !== "PARTNER") {
      return new NextResponse("Accès non autorisé", { status: 403 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      storefront: user.storefront
    })
  } catch (error: any) {
    console.error("[USER_PARTNER_DATA_GET] Erreur:", error)
    return new NextResponse(`Erreur interne: ${error.message}`, { status: 500 })
  }
} 
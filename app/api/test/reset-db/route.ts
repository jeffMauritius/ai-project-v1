import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    console.log("[RESET_DB] Début de la réinitialisation de la base de données")
    
    // Supprimer toutes les collections
    await prisma.$transaction([
      prisma.partnerStorefront.deleteMany(),
      prisma.profile.deleteMany(),
      prisma.user.deleteMany(),
    ])
    
    console.log("[RESET_DB] Toutes les collections ont été supprimées")
    return NextResponse.json({ message: "Base de données réinitialisée avec succès" })
  } catch (error: any) {
    console.error("[RESET_DB] Erreur détaillée:", error)
    return new NextResponse(`Erreur lors de la réinitialisation: ${error.message}`, { status: 500 })
  }
} 
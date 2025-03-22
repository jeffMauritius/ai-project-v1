import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    console.log("[TEST_CREATE_PARTNER] Début de la création du partenaire")
    
    // Supprimer l'utilisateur existant s'il existe
    await prisma.user.deleteMany({
      where: {
        email: "partner@test.com"
      }
    })
    console.log("[TEST_CREATE_PARTNER] Ancien utilisateur supprimé s'il existait")

    // Créer un utilisateur partenaire de test
    const hashedPassword = await bcrypt.hash("test123", 10)
    console.log("[TEST_CREATE_PARTNER] Mot de passe hashé créé")
    
    const user = await prisma.user.create({
      data: {
        email: "partner@test.com",
        password: hashedPassword,
        name: "Test Partner",
        role: "PARTNER",
        profile: {
          create: {
            phone: "0123456789",
            company: "Test Company",
            website: "https://test.com",
            bio: "Test Partner Bio"
          }
        }
      },
    })

    console.log("[TEST_CREATE_PARTNER] Utilisateur créé avec succès:", user)
    return NextResponse.json(user)
  } catch (error: any) {
    console.error("[TEST_CREATE_PARTNER] Erreur détaillée:", error)
    return new NextResponse(`Erreur lors de la création du partenaire: ${error.message}`, { status: 500 })
  }
} 
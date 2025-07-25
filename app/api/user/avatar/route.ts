import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from '@vercel/blob'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log("[USER_AVATAR_POST] Utilisateur non authentifié")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    console.log("[USER_AVATAR_POST] Début de l'upload d'avatar")
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[USER_AVATAR_POST] Fichier manquant")
      return new NextResponse("Fichier manquant", { status: 400 })
    }

    console.log("[USER_AVATAR_POST] Type de fichier:", file.type)
    console.log("[USER_AVATAR_POST] Taille du fichier:", file.size)

    // Vérifier la taille du fichier (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      console.log("[USER_AVATAR_POST] Fichier trop volumineux")
      return new NextResponse("Fichier trop volumineux (max 1MB)", { status: 400 })
    }

    // Vérifier le type de fichier (JPG, GIF, PNG)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      console.log("[USER_AVATAR_POST] Type de fichier non supporté")
      return new NextResponse("Type de fichier non supporté. Utilisez JPG, GIF ou PNG.", { status: 400 })
    }

    // Convertir le fichier en buffer
    console.log("[USER_AVATAR_POST] Conversion du fichier en buffer")
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload du fichier vers le Blob Store de Vercel
    console.log("[USER_AVATAR_POST] Upload vers le Blob Store")
    const blob = await put(`avatars/${session.user.id}-${Date.now()}.${file.name.split('.').pop()}`, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    })

    console.log("[USER_AVATAR_POST] Fichier uploadé avec succès:", blob.url)

    // Mettre à jour l'utilisateur avec la nouvelle URL d'avatar
    console.log("[USER_AVATAR_POST] Mise à jour de l'utilisateur")
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        image: blob.url,
      },
    })

    console.log("[USER_AVATAR_POST] Utilisateur mis à jour avec succès")
    return NextResponse.json({ 
      success: true, 
      avatarUrl: blob.url,
      message: "Avatar mis à jour avec succès"
    })
  } catch (error: any) {
    console.error("[USER_AVATAR_POST] Erreur détaillée:", error)
    console.error("[USER_AVATAR_POST] Stack trace:", error.stack)
    return new NextResponse(`Erreur interne: ${error.message || 'Erreur inconnue'}`, { status: 500 })
  }
} 
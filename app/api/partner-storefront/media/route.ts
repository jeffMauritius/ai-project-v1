import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from '@vercel/blob'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const storefront = await prisma.partnerStorefront.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        media: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!storefront) {
      return new NextResponse("Vitrine non trouvée", { status: 404 })
    }

    return NextResponse.json(storefront.media)
  } catch (error) {
    console.error("[PARTNER_STOREFRONT_MEDIA_GET]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log("[PARTNER_STOREFRONT_MEDIA_POST] Utilisateur non authentifié")
      return new NextResponse("Non autorisé", { status: 401 })
    }

    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Début de l'upload")
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!file) {
      console.log("[PARTNER_STOREFRONT_MEDIA_POST] Fichier manquant")
      return new NextResponse("Fichier manquant", { status: 400 })
    }

    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Type de fichier:", file.type)
    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Taille du fichier:", file.size)

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log("[PARTNER_STOREFRONT_MEDIA_POST] Fichier trop volumineux")
      return new NextResponse("Fichier trop volumineux", { status: 400 })
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      console.log("[PARTNER_STOREFRONT_MEDIA_POST] Type de fichier non supporté")
      return new NextResponse("Type de fichier non supporté", { status: 400 })
    }

    // Convertir le fichier en buffer
    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Conversion du fichier en buffer")
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Déterminer le type de fichier
    const fileType = file.type.startsWith("image/") ? "IMAGE" : "VIDEO"
    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Type de média:", fileType)

    // Upload du fichier vers le Blob Store de Vercel
    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Upload vers le Blob Store")
    const blob = await put(file.name, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    })

    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Fichier uploadé avec succès:", blob.url)

    // Rechercher la vitrine
    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Recherche de la vitrine")
    const storefront = await prisma.partnerStorefront.findUnique({
      where: {
        userId: session.user.id,
      }
    })

    if (!storefront) {
      console.log("[PARTNER_STOREFRONT_MEDIA_POST] Vitrine non trouvée")
      return new NextResponse("Vitrine non trouvée", { status: 404 })
    }

    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Création du média dans la base de données")
    console.log("[PARTNER_STOREFRONT_MEDIA_POST] Données du média:", {
      url: blob.url,
      type: fileType,
      title: title || null,
      description: description || null,
      storefrontId: storefront.id,
      order: 0
    })

    try {
      // Créer le média avec le bon type pour MongoDB
      const media = await prisma.media.create({
        data: {
          url: blob.url,
          type: fileType,
          title: title || null,
          description: description || null,
          storefrontId: storefront.id,
          order: 0 // Par défaut, on met l'ordre à 0
        }
      })

      console.log("[PARTNER_STOREFRONT_MEDIA_POST] Média créé avec succès:", media)
      return NextResponse.json(media)
    } catch (dbError: any) {
      console.error("[PARTNER_STOREFRONT_MEDIA_POST] Erreur lors de la création du média:", dbError)
      console.error("[PARTNER_STOREFRONT_MEDIA_POST] Stack trace:", dbError.stack)
      return new NextResponse(`Erreur lors de la création du média: ${dbError.message || 'Erreur inconnue'}`, { status: 500 })
    }
  } catch (error: any) {
    console.error("[PARTNER_STOREFRONT_MEDIA_POST] Erreur détaillée:", error)
    console.error("[PARTNER_STOREFRONT_MEDIA_POST] Stack trace:", error.stack)
    return new NextResponse(`Erreur interne: ${error.message || 'Erreur inconnue'}`, { status: 500 })
  }
} 
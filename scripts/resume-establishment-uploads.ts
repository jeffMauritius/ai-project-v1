import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'

const prisma = new PrismaClient()

// Fonction pour télécharger une image avec fetch
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.mariages.net/',
      'Origin': 'https://www.mariages.net',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Fonction pour vérifier si une image existe déjà dans Vercel Blob
async function imageExists(blobUrl: string): Promise<boolean> {
  try {
    const response = await fetch(blobUrl, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

async function resumeEstablishmentUploads() {
  console.log('🔄 REPRISE DES UPLOADS D\'ESTABLISHMENTS (960p)\n')

  try {
    // Charger venues.json
    const fs = require('fs')
    const path = require('path')
    const venuesPath = path.join(__dirname, '..', 'data', 'venues.json')
    const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'))
    const venues = venuesData.venues || venuesData

    console.log(`📄 ${venues.length} venues chargées`)

    // Récupérer tous les establishments
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true
      }
    })

    console.log(`🏢 ${establishments.length} establishments en base`)

    let processedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const establishment of establishments) {
      processedCount++
      
      // Trouver le venue correspondant par nom
      const venue = venues.find((v: any) => 
        v.name && establishment.name &&
        v.name.toLowerCase().trim() === establishment.name.toLowerCase().trim()
      )

      if (!venue) {
        console.log(`⚠️ [${processedCount}/${establishments.length}] Venue non trouvé pour: ${establishment.name}`)
        continue
      }

      if (!venue.images || venue.images.length === 0) {
        console.log(`⚠️ [${processedCount}/${establishments.length}] Aucune image pour: ${establishment.name}`)
        continue
      }

      console.log(`\n🔄 [${processedCount}/${establishments.length}] Traitement de: ${establishment.name} (${establishment.id})`)

      // Vérifier si des images 960p existent déjà
      const existingImages = establishment.images || []
      const has960pImages = existingImages.some((url: string) => url.includes('/960/'))
      
      if (has960pImages) {
        console.log(`✅ Images 960p déjà présentes, passage au suivant`)
        skippedCount++
        continue
      }

      const newImages: string[] = []

      for (let i = 0; i < venue.images.length; i++) {
        const imageUrl = venue.images[i]
        
        try {
          // Construire l'URL de destination
          const blobUrl = `https://blob.vercel-storage.com/establishments/${establishment.id}/960/image-${i + 1}.jpg`
          
          // Vérifier si l'image existe déjà
          if (await imageExists(blobUrl)) {
            console.log(`✅ Image ${i + 1} déjà uploadée`)
            newImages.push(blobUrl)
            continue
          }

          console.log(`📥 Téléchargement image ${i + 1}/${venue.images.length}: ${imageUrl}`)
          
          // Télécharger l'image
          const imageBuffer = await downloadImage(imageUrl)
          
          // Upload vers Vercel Blob
          const blob = await put(`establishments/${establishment.id}/960/image-${i + 1}.jpg`, imageBuffer, {
            access: 'public',
            contentType: 'image/jpeg'
          })
          
          console.log(`✅ Image ${i + 1} uploadée: ${blob.url}`)
          newImages.push(blob.url)
          
          // Petite pause pour éviter de surcharger
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (error) {
          console.error(`❌ Erreur image ${i + 1}:`, error)
          errorCount++
        }
      }

      // Mettre à jour la base de données avec les nouvelles URLs
      if (newImages.length > 0) {
        await prisma.establishment.update({
          where: { id: establishment.id },
          data: { images: newImages }
        })
        console.log(`💾 ${newImages.length} images sauvegardées en base`)
      }

      // Pause entre les establishments
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n📊 RÉSULTATS FINAUX:')
    console.log(`✅ ${processedCount} establishments traités`)
    console.log(`⏭️ ${skippedCount} establishments ignorés (déjà uploadés)`)
    console.log(`❌ ${errorCount} erreurs`)

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resumeEstablishmentUploads()

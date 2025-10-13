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

async function resumePartnerUploads() {
  console.log('🔄 REPRISE DES UPLOADS DE PARTNERS (960p)\n')

  try {
    // Charger tous les fichiers JSON de partenaires
    const fs = require('fs')
    const path = require('path')
    
    const dataDir = path.join(__dirname, '..', 'data')
    const jsonFiles = [
      'photographers.json', 'caterers.json', 'decorators.json', 
      'videographers.json', 'music-vendors.json', 'transport.json',
      'florists.json', 'entertainment.json', 'wedding-cakes.json',
      'invitations.json', 'organization.json', 'gifts.json',
      'officiants.json', 'honeymoon.json', 'beauty.json',
      'dresses.json', 'suits.json', 'jewelry.json', 'wine-spirits.json'
    ]

    // Charger tous les fichiers JSON
    const allJsonData: any[] = []
    for (const file of jsonFiles) {
      const filePath = path.join(dataDir, file)
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const vendors = data.vendors || data || []
        allJsonData.push(...vendors)
      }
    }

    console.log(`📄 ${allJsonData.length} entrées JSON chargées`)

    // Récupérer tous les partenaires (pas les establishments)
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        serviceType: true
      }
    })

    console.log(`🤝 ${partners.length} partners en base`)

    let processedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const partner of partners) {
      processedCount++
      
      // Trouver le partenaire dans les données JSON par nom
      const jsonEntry = allJsonData.find(entry => 
        entry.name && partner.companyName &&
        entry.name.toLowerCase().trim() === partner.companyName.toLowerCase().trim()
      )

      if (!jsonEntry) {
        console.log(`⚠️ [${processedCount}/${partners.length}] JSON non trouvé pour: ${partner.companyName}`)
        continue
      }

      if (!jsonEntry.images || jsonEntry.images.length === 0) {
        console.log(`⚠️ [${processedCount}/${partners.length}] Aucune image pour: ${partner.companyName}`)
        continue
      }

      console.log(`\n🔄 [${processedCount}/${partners.length}] Traitement de: ${partner.companyName} (${partner.id})`)

      // Vérifier si des images 960p existent déjà dans les PartnerStorefront
      const storefronts = await prisma.partnerStorefront.findMany({
        where: { partnerId: partner.id },
        select: { images: true }
      })

      const has960pImages = storefronts.some(sf => 
        sf.images && sf.images.some((url: string) => url.includes('/960/'))
      )
      
      if (has960pImages) {
        console.log(`✅ Images 960p déjà présentes, passage au suivant`)
        skippedCount++
        continue
      }

      const newImages: string[] = []

      for (let i = 0; i < jsonEntry.images.length; i++) {
        const imageUrl = jsonEntry.images[i]
        
        try {
          // Construire l'URL de destination
          const blobUrl = `https://blob.vercel-storage.com/partners/${partner.id}/960/image-${i + 1}.jpg`
          
          // Vérifier si l'image existe déjà
          if (await imageExists(blobUrl)) {
            console.log(`✅ Image ${i + 1} déjà uploadée`)
            newImages.push(blobUrl)
            continue
          }

          console.log(`📥 Téléchargement image ${i + 1}/${jsonEntry.images.length}: ${imageUrl}`)
          
          // Télécharger l'image
          const imageBuffer = await downloadImage(imageUrl)
          
          // Upload vers Vercel Blob
          const blob = await put(`partners/${partner.id}/960/image-${i + 1}.jpg`, imageBuffer, {
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
        // Mettre à jour tous les storefronts de ce partenaire
        await prisma.partnerStorefront.updateMany({
          where: { partnerId: partner.id },
          data: { images: newImages }
        })
        console.log(`💾 ${newImages.length} images sauvegardées en base`)
      }

      // Pause entre les partenaires
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n📊 RÉSULTATS FINAUX:')
    console.log(`✅ ${processedCount} partners traités`)
    console.log(`⏭️ ${skippedCount} partners ignorés (déjà uploadés)`)
    console.log(`❌ ${errorCount} erreurs`)

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resumePartnerUploads()

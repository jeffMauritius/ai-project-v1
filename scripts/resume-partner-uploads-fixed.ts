import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

class ResumePartnerUploader {
  private delayBetweenRequests = 1000 // 1 seconde entre chaque upload

  async resumeUploads() {
    console.log('🔄 REPRISE DES UPLOADS DE PARTNERS (960p)\n')
    
    try {
      // Charger toutes les données JSON des partenaires
      const allJsonData = await this.loadAllPartnerJsonData()
      
      // Récupérer tous les partenaires (pas les establishments)
      const partners = await prisma.partner.findMany({
        select: {
          id: true,
          companyName: true,
          serviceType: true
        }
      })
      
      console.log(`📊 ${partners.length} partners en base`)
      
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
        
        // Vérifier si le dossier /960/ contient déjà des images
        const has960pImages = await this.check960pFolderExists('partners', partner.id)
        
        if (has960pImages) {
          console.log(`✅ Dossier /960/ déjà présent avec images, passage au suivant`)
          skippedCount++
          continue
        }
        
        // Filtrer les URLs 960p (qui contiennent /960/)
        const images960p = jsonEntry.images.filter((url: string) => url.includes('/960/'))
        
        if (images960p.length === 0) {
          console.log(`⚠️ Aucune image 960p trouvée pour ${partner.companyName}`)
          continue
        }
        
        console.log(`📸 ${images960p.length} images 960p à uploader`)
        
        const newImageUrls: string[] = []
        
        for (let i = 0; i < images960p.length; i++) {
          const imageUrl = images960p[i]
          
          // Construire l'URL de destination
          const blobUrl = `https://blob.vercel-storage.com/partners/${partner.id}/960/image-${i + 1}.jpg`
          
          // Vérifier si l'image existe déjà
          if (await this.imageExists(blobUrl)) {
            console.log(`✅ Image ${i + 1} déjà uploadée`)
            newImageUrls.push(blobUrl)
            continue
          }
          
          console.log(`📥 Upload image ${i + 1}/${images960p.length}`)
          
          const result = await this.uploadImage(
            imageUrl,
            'partners',
            partner.id,
            i + 1
          )
          
          if (result.success && result.newUrl) {
            newImageUrls.push(result.newUrl)
            console.log(`✅ Image ${i + 1} uploadée`)
          } else {
            errorCount++
            console.log(`❌ Échec image ${i + 1}: ${result.error}`)
          }
          
          // Délai entre les uploads
          await this.delay(this.delayBetweenRequests)
        }
        
        // Mettre à jour la base de données avec les nouvelles URLs
        if (newImageUrls.length > 0) {
          // Mettre à jour tous les storefronts de ce partenaire
          await prisma.partnerStorefront.updateMany({
            where: { partnerId: partner.id },
            data: { images: newImageUrls }
          })
          console.log(`💾 ${newImageUrls.length} images sauvegardées en base`)
        }
        
        // Pause entre les partenaires
        await this.delay(500)
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
  
  private async loadAllPartnerJsonData() {
    console.log('📖 Chargement de toutes les données JSON des partenaires...')
    
    const partnerFiles = [
      'beauty.json', 'caterers.json', 'decorators.json', 'dresses.json', 'entertainment.json',
      'florist-decoration.json', 'florists.json', 'gifts.json', 'honeymoon.json', 'invitations.json',
      'jewelry.json', 'music-vendors.json', 'officiants.json', 'organization.json', 'photographers.json',
      'suits.json', 'transport.json', 'videographers.json', 'wedding-cakes.json', 'wine-spirits.json'
    ]
    
    const allData: any[] = []
    
    for (const fileName of partnerFiles) {
      const filePath = path.join(process.cwd(), 'data', fileName)
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  Fichier ${fileName} non trouvé`)
        continue
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(fileContent)
      const vendors = data.vendors || data
      
      if (Array.isArray(vendors)) {
        allData.push(...vendors)
      }
    }
    
    console.log(`📄 ${allData.length} entrées JSON chargées`)
    return allData
  }
  
  private async check960pFolderExists(folder: string, entityId: string): Promise<boolean> {
    try {
      // Vérifier si au moins la première image existe dans le dossier /960/
      const firstImageUrl = `https://blob.vercel-storage.com/${folder}/${entityId}/960/image-1.jpg`
      const response = await fetch(firstImageUrl, { method: 'HEAD' })
      
      if (response.ok) {
        console.log(`  📁 Dossier /960/ trouvé avec des images`)
        return true
      }
      
      return false
    } catch {
      return false
    }
  }
  
  private async imageExists(blobUrl: string): Promise<boolean> {
    try {
      const response = await fetch(blobUrl, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }
  
  private async uploadImage(originalUrl: string, folder: string, partnerId: string, imageIndex: number) {
    try {
      // Vérifier si l'URL est déjà une URL Vercel Blob
      if (originalUrl.includes('blob.vercel-storage.com')) {
        return { success: true, newUrl: originalUrl, error: null }
      }

      console.log(`    📥 Téléchargement: ${originalUrl}`)
      
      // Télécharger l'image depuis l'URL originale avec fetch
      const response = await fetch(originalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.mariages.net/',
          'Origin': 'https://www.mariages.net'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const imageBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const extension = this.getFileExtension(contentType)
      
      // Générer un nom de fichier
      const fileName = `image-${imageIndex}${extension}`
      const blobPath = `${folder}/${partnerId}/960/${fileName}`

      console.log(`    📤 Upload vers: ${blobPath}`)

      // Upload vers Vercel Blob
      const blob = await put(blobPath, imageBuffer, {
        access: 'public',
        contentType: contentType
      })

      return { success: true, newUrl: blob.url, error: null }

    } catch (error) {
      return { 
        success: false, 
        newUrl: null, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }
    }
  }
  
  private getFileExtension(contentType: string): string {
    const extensionMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    }
    
    return extensionMap[contentType.toLowerCase()] || '.jpg'
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Exécution du script
if (require.main === module) {
  const uploader = new ResumePartnerUploader()
  
  uploader.resumeUploads()
    .then(() => {
      console.log('🎉 Reprise des uploads terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { ResumePartnerUploader }

import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

class ResumeEstablishmentUploader {
  private delayBetweenRequests = 1000 // 1 seconde entre chaque upload

  async resumeUploads() {
    console.log('🔄 REPRISE DES UPLOADS D\'ESTABLISHMENTS (960p)\n')
    
    try {
      // Charger les données venues.json
      const venuesData = await this.loadVenuesData()
      
      // Récupérer tous les establishments
      const establishments = await prisma.establishment.findMany({
        select: {
          id: true,
          name: true,
          images: true
        }
      })
      
      console.log(`📊 ${establishments.length} establishments en base`)
      
      let processedCount = 0
      let skippedCount = 0
      let errorCount = 0
      
      for (const establishment of establishments) {
        processedCount++
        
        // Trouver le venue correspondant par nom
        const venue = venuesData.find((v: any) => 
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
        
        // Vérifier si le dossier /960/ contient déjà des images
        const has960pImages = await this.check960pFolderExists('establishments', establishment.id)
        
        if (has960pImages) {
          console.log(`✅ Dossier /960/ déjà présent avec images, passage au suivant`)
          skippedCount++
          continue
        }
        
        // Filtrer les URLs 960p (qui contiennent /960/)
        const images960p = venue.images.filter((url: string) => url.includes('/960/'))
        
        if (images960p.length === 0) {
          console.log(`⚠️ Aucune image 960p trouvée pour ${establishment.name}`)
          continue
        }
        
        console.log(`📸 ${images960p.length} images 960p à uploader`)
        
        const newImageUrls: string[] = []
        
        for (let i = 0; i < images960p.length; i++) {
          const imageUrl = images960p[i]
          
          // Construire l'URL de destination
          const blobUrl = `https://blob.vercel-storage.com/establishments/${establishment.id}/960/image-${i + 1}.jpg`
          
          // Vérifier si l'image existe déjà
          if (await this.imageExists(blobUrl)) {
            console.log(`✅ Image ${i + 1} déjà uploadée`)
            newImageUrls.push(blobUrl)
            continue
          }
          
          console.log(`📥 Upload image ${i + 1}/${images960p.length}`)
          
          const result = await this.uploadImage(
            imageUrl,
            'establishments',
            establishment.id,
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
          await prisma.establishment.update({
            where: { id: establishment.id },
            data: { images: newImageUrls }
          })
          console.log(`💾 ${newImageUrls.length} images sauvegardées en base`)
        }
        
        // Pause entre les establishments
        await this.delay(500)
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
  
  private async loadVenuesData() {
    const venuesPath = path.join(process.cwd(), 'data', 'venues.json')
    
    if (!fs.existsSync(venuesPath)) {
      throw new Error('Fichier venues.json non trouvé')
    }
    
    const venuesContent = fs.readFileSync(venuesPath, 'utf-8')
    const venuesData = JSON.parse(venuesContent)
    
    // Le fichier venues.json a une structure { venues: [...] }
    const venues = venuesData.venues || venuesData
    
    console.log(`📄 ${venues.length} venues chargées`)
    
    return venues
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
  
  private async uploadImage(originalUrl: string, folder: string, entityId: string, imageIndex: number) {
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
      const blobPath = `${folder}/${entityId}/960/${fileName}`

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
  const uploader = new ResumeEstablishmentUploader()
  
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

export { ResumeEstablishmentUploader }

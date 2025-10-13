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
        },
        orderBy: { id: 'asc' } // Ordre croissant pour reprendre au bon endroit
      })
      
      console.log(`📊 ${establishments.length} establishments en base`)
      
      // ID où ça s'est arrêté : Laboratoire des Précieuses (68bffcbb2a6e093129faeb88)
      const stoppedAtId = '68bffcbb2a6e093129faeb88'
      
      // Trouver l'index où reprendre
      const resumeIndex = establishments.findIndex(e => e.id === stoppedAtId)
      
      if (resumeIndex === -1) {
        console.log(`❌ ID d'arrêt non trouvé: ${stoppedAtId}`)
        return
      }
      
      console.log(`🎯 Reprise à partir de l'index ${resumeIndex + 1} (${establishments[resumeIndex].name})`)
      
      let processedCount = 0
      let skippedCount = 0
      let errorCount = 0
      
      // Reprendre à partir de l'index suivant
      for (let i = resumeIndex + 1; i < establishments.length; i++) {
        const establishment = establishments[i]
        processedCount++
        
        // Trouver le venue correspondant par nom
        const venue = venuesData.find((v: any) => 
          v.name && establishment.name &&
          v.name.toLowerCase().trim() === establishment.name.toLowerCase().trim()
        )
        
        if (!venue) {
          console.log(`⚠️ [${i + 1}/${establishments.length}] Venue non trouvé pour: ${establishment.name}`)
          continue
        }
        
        if (!venue.images || venue.images.length === 0) {
          console.log(`⚠️ [${i + 1}/${establishments.length}] Aucune image pour: ${establishment.name}`)
          continue
        }
        
        console.log(`\n🔄 [${i + 1}/${establishments.length}] Traitement de: ${establishment.name} (${establishment.id})`)
        
        // Filtrer les URLs 960p (qui contiennent /960/)
        const images960p = venue.images.filter((url: string) => url.includes('/960/'))
        
        if (images960p.length === 0) {
          console.log(`⚠️ Aucune image 960p trouvée pour ${establishment.name}`)
          continue
        }
        
        console.log(`📸 ${images960p.length} images 960p à uploader`)
        
        const newImageUrls: string[] = []
        
        for (let j = 0; j < images960p.length; j++) {
          const imageUrl = images960p[j]
          
          console.log(`📥 Upload image ${j + 1}/${images960p.length}`)
          
          const result = await this.uploadImage(
            imageUrl,
            'establishments',
            establishment.id,
            j + 1
          )
          
          if (result.success && result.newUrl) {
            newImageUrls.push(result.newUrl)
            console.log(`✅ Image ${j + 1} uploadée`)
          } else {
            errorCount++
            console.log(`❌ Échec image ${j + 1}: ${result.error}`)
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

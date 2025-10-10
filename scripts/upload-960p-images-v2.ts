import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface UploadProgress {
  totalEntities: number
  processedEntities: number
  totalImages: number
  uploadedImages: number
  failedImages: number
  currentEntity: string
}

class Image960pUploader {
  private progress: UploadProgress
  private delayBetweenRequests = 1000 // 1 seconde entre chaque upload

  constructor() {
    this.progress = {
      totalEntities: 0,
      processedEntities: 0,
      totalImages: 0,
      uploadedImages: 0,
      failedImages: 0,
      currentEntity: ''
    }
  }

  async uploadAll960pImages() {
    console.log('📤 Début de l\'upload des images 960p...')
    
    try {
      // Charger les données venues.json pour récupérer les URLs 960p
      const venuesData = await this.loadVenuesData()
      
      // Upload des images 960p des établissements
      await this.uploadEstablishment960pImages(venuesData)
      
      console.log('✅ Upload des images 960p terminé !')
      this.printStats()
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload des images 960p:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async loadVenuesData() {
    console.log('📖 Chargement des données venues.json...')
    
    const venuesPath = path.join(process.cwd(), 'data', 'venues.json')
    
    if (!fs.existsSync(venuesPath)) {
      throw new Error('Fichier venues.json non trouvé')
    }
    
    const venuesContent = fs.readFileSync(venuesPath, 'utf-8')
    const venuesData = JSON.parse(venuesContent)
    
    // Le fichier venues.json a une structure { venues: [...] }
    const venues = venuesData.venues || venuesData
    
    console.log(`📊 ${venues.length} établissements trouvés dans venues.json`)
    
    return venues
  }

  private async uploadEstablishment960pImages(venuesData: any[]) {
    console.log('🏛️  Upload des images 960p des établissements (TOUS)...')
    
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true
      }
    })
    
    console.log(`📊 ${establishments.length} établissements trouvés en base`)
    
    this.progress.totalEntities = establishments.length
    
    for (let i = 0; i < establishments.length; i++) {
      const establishment = establishments[i]
      this.progress.currentEntity = establishment.name
      console.log(`\n📁 [${i + 1}/${establishments.length}] Traitement de: ${establishment.name} (${establishment.id})`)
      
      // Trouver les données correspondantes dans venues.json par nom
      const venueData = venuesData.find(v => 
        v.name?.toLowerCase() === establishment.name?.toLowerCase()
      )
      
      if (!venueData) {
        console.log(`  ⚠️  Aucune donnée venues.json trouvée pour ${establishment.name}`)
        continue
      }
      
      if (!venueData.images || venueData.images.length === 0) {
        console.log(`  ⚠️  Aucune image trouvée dans venues.json pour ${establishment.name}`)
        continue
      }
      
      // Filtrer les URLs 960p (qui contiennent /960/)
      const images960p = venueData.images.filter((url: string) => url.includes('/960/'))
      
      if (images960p.length === 0) {
        console.log(`  ⚠️  Aucune image 960p trouvée pour ${establishment.name}`)
        continue
      }
      
      console.log(`  📸 ${images960p.length} images 960p à uploader`)
      
      const newImageUrls: string[] = []
      
      for (let i = 0; i < images960p.length; i++) {
        const imageUrl = images960p[i]
        
        console.log(`  🔄 Upload image ${i + 1}/${images960p.length}`)
        
        const result = await this.uploadImage(
          imageUrl,
          'establishments',
          establishment.id,
          i + 1
        )
        
        if (result.success && result.newUrl) {
          newImageUrls.push(result.newUrl)
          this.progress.uploadedImages++
          console.log(`    ✅ Image ${i + 1} uploadée`)
        } else {
          this.progress.failedImages++
          console.log(`    ❌ Échec image ${i + 1}: ${result.error}`)
        }
        
        this.progress.totalImages++
        
        // Délai entre les uploads
        await this.delay(this.delayBetweenRequests)
      }
      
      console.log(`  📝 ${establishment.name}: ${newImageUrls.length} images uploadées dans establishments/${establishment.id}/960/`)
      
      this.progress.processedEntities++
      
      // Afficher le progrès après chaque établissement
      const progressPercent = ((this.progress.processedEntities / this.progress.totalEntities) * 100).toFixed(1)
      console.log(`  📊 Progrès: ${this.progress.processedEntities}/${this.progress.totalEntities} établissements (${progressPercent}%)`)
      console.log(`  🖼️  Images: ${this.progress.uploadedImages} uploadées, ${this.progress.failedImages} échouées`)
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

  private printStats() {
    console.log('\n📊 Statistiques d\'upload 960p:')
    console.log(`📤 Images uploadées: ${this.progress.uploadedImages}`)
    console.log(`❌ Échecs d'upload: ${this.progress.failedImages}`)
    console.log(`📈 Taux de succès: ${((this.progress.uploadedImages / (this.progress.uploadedImages + this.progress.failedImages)) * 100).toFixed(2)}%`)
  }
}

// Exécution du script
if (require.main === module) {
  const uploader = new Image960pUploader()
  
  uploader.uploadAll960pImages()
    .then(() => {
      console.log('🎉 Upload 960p terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { Image960pUploader }

import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'

const prisma = new PrismaClient()

interface ImageUploadResult {
  originalUrl: string
  newUrl: string
  success: boolean
  error?: string
}

interface UploadProgress {
  totalImages: number
  uploadedImages: number
  failedUploads: number
  currentEntity: string
}

class Image960pUploader {
  private progress: UploadProgress
  private maxConcurrent: number
  private retryAttempts: number

  constructor(maxConcurrent = 3, retryAttempts = 3) {
    this.progress = {
      totalImages: 0,
      uploadedImages: 0,
      failedUploads: 0,
      currentEntity: ''
    }
    this.maxConcurrent = maxConcurrent
    this.retryAttempts = retryAttempts
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
    console.log('🏛️  Upload des images 960p des établissements (TEST - 5 premiers)...')
    
    // Test sur un seul établissement d'abord
    const testEstablishmentIds = [
      '68bfdf673b250b8ab117324b'  // Domaine de la Maison de Colette
    ]
    
    const establishments = await prisma.establishment.findMany({
      where: {
        id: {
          in: testEstablishmentIds
        }
      },
      select: {
        id: true,
        name: true,
        images: true
      }
    })
    
    console.log(`📊 ${establishments.length} établissements de test trouvés en base`)
    
    for (const establishment of establishments) {
      this.progress.currentEntity = establishment.name
      console.log(`📁 Traitement de: ${establishment.name} (${establishment.id})`)
      
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
      
      // Uploader les images dans le dossier establishments/{id}/960/
      const uploadResults = await this.uploadImageBatch960p(
        images960p,
        `establishments/${establishment.id}/960`,
        establishment.name
      )
      
      // Afficher les résultats
      const successCount = uploadResults.filter(r => r.success).length
      const failCount = uploadResults.filter(r => !r.success).length
      
      console.log(`  ✅ ${successCount} images uploadées, ❌ ${failCount} échecs`)
      
      // Petite pause entre les établissements
      await this.delay(1000)
    }
  }

  private async uploadImageBatch960p(
    imageUrls: string[],
    folderPath: string,
    entityName: string
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = []
    const batches = this.chunkArray(imageUrls, this.maxConcurrent)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`    📦 Batch ${i + 1}/${batches.length} (${batch.length} images)`)
      
      const batchResults = []
      for (let j = 0; j < batch.length; j++) {
        const imageUrl = batch[j]
        const imageIndex = i * this.maxConcurrent + j
        const result = await this.uploadSingleImage960p(imageUrl, folderPath, imageIndex, entityName)
        batchResults.push(result)
        
        // Délai entre chaque image pour éviter le rate limiting
        if (j < batch.length - 1) {
          await this.delay(800)
        }
      }
      results.push(...batchResults)
      
      // Pause entre les batches pour éviter la surcharge
      if (i < batches.length - 1) {
        await this.delay(2000)
      }
    }
    
    return results
  }

  private async uploadSingleImage960p(
    imageUrl: string,
    folderPath: string,
    imageIndex: number,
    entityName: string
  ): Promise<ImageUploadResult> {
    const result: ImageUploadResult = {
      originalUrl: imageUrl,
      newUrl: '',
      success: false
    }
    
    try {
      // Télécharger l'image
      const imageBuffer = await this.downloadImage(imageUrl)
      
      if (!imageBuffer) {
        result.error = 'Impossible de télécharger l\'image'
        this.progress.failedUploads++
        return result
      }
      
      // Déterminer l'extension du fichier
      const extension = this.getImageExtension(imageUrl)
      const fileName = `image-${imageIndex + 1}`
      const blobPath = `${folderPath}/${fileName}.${extension}`
      
      // Upload vers Vercel Blob
      const { url } = await put(blobPath, imageBuffer, {
        access: 'public',
        addRandomSuffix: false
      })
      
      result.newUrl = url
      result.success = true
      this.progress.uploadedImages++
      
      console.log(`      ✅ ${fileName}.${extension} uploadé`)
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Erreur inconnue'
      this.progress.failedUploads++
      console.error(`      ❌ Erreur upload ${imageUrl}:`, error)
    }
    
    return result
  }

  private async downloadImage(url: string): Promise<Buffer | null> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await new Promise<Buffer>((resolve, reject) => {
          const protocol = url.startsWith('https:') ? https : http
          
          const request = protocol.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Fetch-Dest': 'image',
              'Sec-Fetch-Mode': 'no-cors',
              'Sec-Fetch-Site': 'cross-site',
              'Referer': 'https://www.mariages.net/',
              'Origin': 'https://www.mariages.net',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            },
            timeout: 30000
          }, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`HTTP ${response.statusCode}`))
              return
            }
            
            const chunks: Buffer[] = []
            response.on('data', (chunk) => chunks.push(chunk))
            response.on('end', () => resolve(Buffer.concat(chunks as any)))
            response.on('error', reject)
          })
          
          request.setTimeout(30000, () => {
            request.destroy()
            reject(new Error('Timeout'))
          })
          
          request.on('error', reject)
        })
        
      } catch (error) {
        console.error(`      ⚠️  Tentative ${attempt}/${this.retryAttempts} échouée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        
        if (attempt === this.retryAttempts) {
          console.error(`      ❌ Échec définitif après ${this.retryAttempts} tentatives: ${url}`)
          return null
        }
        
        // Attendre avant de réessayer (délai progressif)
        await this.delay(2000 * attempt)
      }
    }
    
    return null
  }

  private getImageExtension(url: string): string {
    const urlParts = url.split('.')
    const extension = urlParts[urlParts.length - 1].split('?')[0]
    
    // Normaliser les extensions
    const extensionMap: Record<string, string> = {
      'jpg': 'jpg',
      'jpeg': 'jpg',
      'png': 'png',
      'webp': 'webp',
      'gif': 'gif'
    }
    
    return extensionMap[extension.toLowerCase()] || 'jpg'
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private printStats() {
    console.log('\n📊 Statistiques d\'upload 960p:')
    console.log(`📤 Images uploadées: ${this.progress.uploadedImages}`)
    console.log(`❌ Échecs d'upload: ${this.progress.failedUploads}`)
    console.log(`📈 Taux de succès: ${((this.progress.uploadedImages / (this.progress.uploadedImages + this.progress.failedUploads)) * 100).toFixed(2)}%`)
  }
}

// Exécution du script
if (require.main === module) {
  const uploader = new Image960pUploader(3, 3)
  
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

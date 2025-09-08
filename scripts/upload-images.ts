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

class ImageUploader {
  private progress: UploadProgress
  private maxConcurrent: number
  private retryAttempts: number

  constructor(maxConcurrent = 5, retryAttempts = 3) {
    this.progress = {
      totalImages: 0,
      uploadedImages: 0,
      failedUploads: 0,
      currentEntity: ''
    }
    this.maxConcurrent = maxConcurrent
    this.retryAttempts = retryAttempts
  }

  async uploadAllImages() {
    console.log('📤 Début de l\'upload des images...')
    
    try {
      // Upload des images des établissements
      await this.uploadEstablishmentImages()
      
      // Upload des images des partenaires
      await this.uploadPartnerImages()
      
      console.log('✅ Upload des images terminé !')
      this.printStats()
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload des images:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async uploadEstablishmentImages() {
    console.log('🏛️  Upload des images des établissements...')
    
    const establishments = await prisma.establishment.findMany()
    
    for (const establishment of establishments) {
      this.progress.currentEntity = establishment.name
      console.log(`📁 Traitement de: ${establishment.name}`)
      
      if (establishment.images && establishment.images.length > 0) {
        const uploadResults = await this.uploadImageBatch(
          establishment.images,
          `venues/${establishment.id}`,
          establishment.name
        )
        
        // Mettre à jour les URLs dans la base de données
        await this.updateEstablishmentImages(establishment.id, uploadResults)
      }
    }
  }

  private async uploadPartnerImages() {
    console.log('👥 Upload des images des partenaires...')
    
    const partners = await prisma.partner.findMany({
      include: {
        storefronts: true
      }
    })
    
    for (const partner of partners) {
      this.progress.currentEntity = partner.companyName
      console.log(`📁 Traitement de: ${partner.companyName}`)
      
      // Récupérer les images depuis la vitrine du partenaire
      const storefront = partner.storefronts[0]
      if (storefront) {
        const media = await prisma.media.findMany({
          where: { storefrontId: storefront.id }
        })
        
        if (media.length > 0) {
          const imageUrls = media.map(m => m.url)
          const uploadResults = await this.uploadImageBatch(
            imageUrls,
            `${partner.serviceType.toLowerCase()}/${partner.id}`,
            partner.companyName
          )
          
          // Mettre à jour les URLs dans la base de données
          await this.updatePartnerImages(partner.id, uploadResults)
        }
      }
    }
  }

  private async uploadImageBatch(
    imageUrls: string[],
    folderPath: string,
    entityName: string
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = []
    const batches = this.chunkArray(imageUrls, this.maxConcurrent)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`  📦 Batch ${i + 1}/${batches.length} (${batch.length} images)`)
      
      const batchResults = []
      for (let j = 0; j < batch.length; j++) {
        const imageUrl = batch[j]
        const imageIndex = i * this.maxConcurrent + j
        const result = await this.uploadSingleImage(imageUrl, folderPath, imageIndex, entityName)
        batchResults.push(result)
        
        // Délai entre chaque image pour éviter le rate limiting
        if (j < batch.length - 1) {
          await this.delay(500)
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

  private async uploadSingleImage(
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
      const fileName = imageIndex === 0 ? 'main' : `gallery-${imageIndex}`
      const blobPath = `${folderPath}/${fileName}.${extension}`
      
      // Upload vers Vercel Blob
      const { url } = await put(blobPath, imageBuffer, {
        access: 'public',
        addRandomSuffix: false
      })
      
      result.newUrl = url
      result.success = true
      this.progress.uploadedImages++
      
      console.log(`    ✅ ${fileName}.${extension} uploadé`)
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Erreur inconnue'
      this.progress.failedUploads++
      console.error(`    ❌ Erreur upload ${imageUrl}:`, error)
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
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
              'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`HTTP ${response.statusCode}`))
              return
            }
            
            const chunks: Buffer[] = []
            response.on('data', (chunk) => chunks.push(chunk))
            response.on('end', () => resolve(Buffer.concat(chunks)))
            response.on('error', reject)
          })
          
          request.setTimeout(30000, () => {
            request.destroy()
            reject(new Error('Timeout'))
          })
          
          request.on('error', reject)
        })
        
      } catch (error) {
        if (attempt === this.retryAttempts) {
          console.error(`    ⚠️  Échec après ${this.retryAttempts} tentatives: ${url}`)
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

  private async updateEstablishmentImages(
    establishmentId: string,
    uploadResults: ImageUploadResult[]
  ) {
    const successfulUploads = uploadResults.filter(r => r.success)
    const newImageUrls = successfulUploads.map(r => r.newUrl)
    
    if (newImageUrls.length > 0) {
      await prisma.establishment.update({
        where: { id: establishmentId },
        data: {
          imageUrl: newImageUrls[0] || null,
          images: newImageUrls
        }
      })
    }
  }

  private async updatePartnerImages(
    partnerId: string,
    uploadResults: ImageUploadResult[]
  ) {
    const successfulUploads = uploadResults.filter(r => r.success)
    
    if (successfulUploads.length > 0) {
      const storefront = await prisma.partnerStorefront.findFirst({
        where: { partnerId }
      })
      
      if (storefront) {
        // Supprimer les anciens médias
        await prisma.media.deleteMany({
          where: { storefrontId: storefront.id }
        })
        
        // Créer les nouveaux médias
        for (let i = 0; i < successfulUploads.length; i++) {
          const result = successfulUploads[i]
          await prisma.media.create({
            data: {
              url: result.newUrl,
              type: 'IMAGE',
              title: `Image ${i + 1}`,
              order: i,
              storefrontId: storefront.id
            }
          })
        }
      }
    }
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
    console.log('\n📊 Statistiques d\'upload:')
    console.log(`📤 Images uploadées: ${this.progress.uploadedImages}`)
    console.log(`❌ Échecs d'upload: ${this.progress.failedUploads}`)
    console.log(`📈 Taux de succès: ${((this.progress.uploadedImages / (this.progress.uploadedImages + this.progress.failedUploads)) * 100).toFixed(2)}%`)
  }
}

// Exécution du script
if (require.main === module) {
  const uploader = new ImageUploader(5, 3)
  
  uploader.uploadAllImages()
    .then(() => {
      console.log('🎉 Upload terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { ImageUploader }

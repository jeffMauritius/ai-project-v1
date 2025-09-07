import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'

const prisma = new PrismaClient()

interface UploadProgress {
  totalEntities: number
  processedEntities: number
  totalImages: number
  uploadedImages: number
  failedImages: number
  currentEntity: string
  currentImage: string
}

interface ImageUploadResult {
  success: boolean
  newUrl?: string
  error?: string
}

class OrganizedImageUploader {
  private progress: UploadProgress
  private batchSize: number
  private delayBetweenRequests: number

  constructor(batchSize = 5, delayBetweenRequests = 500) {
    this.progress = {
      totalEntities: 0,
      processedEntities: 0,
      totalImages: 0,
      uploadedImages: 0,
      failedImages: 0,
      currentEntity: '',
      currentImage: ''
    }
    this.batchSize = batchSize
    this.delayBetweenRequests = delayBetweenRequests
  }

  async uploadAllImages() {
    console.log('📤 Début de l\'upload organisé des images sur Vercel Blob...')
    
    try {
      // Upload des images d'établissements
      await this.uploadEstablishmentImages()
      
      // Upload des images de partenaires
      await this.uploadPartnerImages()
      
      console.log('✅ Upload organisé terminé !')
      this.printFinalStats()
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async uploadEstablishmentImages() {
    console.log('🏛️  Upload des images d\'établissements...')
    
    const totalEstablishments = await prisma.establishment.count({
      where: {
        images: {
          isEmpty: false
        }
      }
    })
    
    this.progress.totalEntities += totalEstablishments
    console.log(`📊 ${totalEstablishments} établissements avec images à traiter`)
    
    let offset = 0
    let processed = 0
    
    while (processed < totalEstablishments) {
      const establishments = await prisma.establishment.findMany({
        where: {
          images: {
            isEmpty: false
          }
        },
        take: this.batchSize,
        skip: offset,
        select: {
          id: true,
          name: true,
          images: true
        }
      })
      
      if (establishments.length === 0) break
      
      for (const establishment of establishments) {
        this.progress.currentEntity = establishment.name
        console.log(`📁 Traitement: ${establishment.name} (${establishment.images.length} images)`)
        
        const newImageUrls: string[] = []
        
        for (let i = 0; i < establishment.images.length; i++) {
          const imageUrl = establishment.images[i]
          this.progress.currentImage = `Image ${i + 1}/${establishment.images.length}`
          
          const result = await this.uploadImage(
            imageUrl,
            'establishments',
            establishment.id,
            i + 1
          )
          
          if (result.success && result.newUrl) {
            newImageUrls.push(result.newUrl)
            this.progress.uploadedImages++
            console.log(`  ✅ Image ${i + 1} uploadée: ${result.newUrl}`)
          } else {
            this.progress.failedImages++
            console.log(`  ❌ Échec image ${i + 1}: ${result.error}`)
            // Garder l'URL originale en cas d'échec
            newImageUrls.push(imageUrl)
          }
          
          this.progress.totalImages++
          
          // Délai entre les uploads
          await this.delay(this.delayBetweenRequests)
        }
        
        // Mettre à jour l'établissement avec les nouvelles URLs
        await prisma.establishment.update({
          where: { id: establishment.id },
          data: { images: newImageUrls }
        })
        
        console.log(`  📝 ${establishment.name} mis à jour avec ${newImageUrls.length} images`)
        
        this.progress.processedEntities++
        processed++
      }
      
      offset += this.batchSize
    }
  }

  private async uploadPartnerImages() {
    console.log('🤝 Upload des images de partenaires...')
    
    // Récupérer tous les partenaires avec leurs storefronts et médias
    const partnersWithMedia = await prisma.partner.findMany({
      include: {
        storefronts: {
          include: {
            media: true
          }
        }
      }
    })
    
    this.progress.totalEntities += partnersWithMedia.length
    console.log(`📊 ${partnersWithMedia.length} partenaires avec médias à traiter`)
    
    for (const partner of partnersWithMedia) {
      this.progress.currentEntity = partner.companyName
      
      // Compter le total de médias pour ce partenaire
      const totalMedia = partner.storefronts.reduce(
        (total, storefront) => total + storefront.media.filter(m => m.url).length, 0
      )
      
      console.log(`📁 Traitement: ${partner.companyName} (${totalMedia} médias)`)
      
      let mediaIndex = 0
      for (const storefront of partner.storefronts) {
        for (const media of storefront.media) {
          if (!media.url) continue
          
          mediaIndex++
          this.progress.currentImage = `Média ${mediaIndex}/${totalMedia}`
          
          const result = await this.uploadImage(
            media.url,
            'partners',
            partner.id,
            media.id
          )
          
          if (result.success && result.newUrl) {
            // Mettre à jour le média avec la nouvelle URL
            await prisma.media.update({
              where: { id: media.id },
              data: { url: result.newUrl }
            })
            
            this.progress.uploadedImages++
            console.log(`  ✅ Média ${mediaIndex} uploadé: ${result.newUrl}`)
          } else {
            this.progress.failedImages++
            console.log(`  ❌ Échec média ${mediaIndex}: ${result.error}`)
          }
          
          this.progress.totalImages++
          
          // Délai entre les uploads
          await this.delay(this.delayBetweenRequests)
        }
      }
      
      this.progress.processedEntities++
    }
  }

  private async uploadImage(
    imageUrl: string,
    category: 'establishments' | 'partners',
    entityId: string,
    imageIndex: number | string
  ): Promise<ImageUploadResult> {
    try {
      // Télécharger l'image depuis l'URL originale
      const response = await fetch(imageUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const imageBuffer = await response.arrayBuffer()
      
      // Déterminer l'extension du fichier
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const extension = this.getFileExtension(contentType)
      
      // Créer le nom de fichier organisé
      const fileName = `image-${imageIndex}${extension}`
      const blobPath = `${category}/${entityId}/${fileName}`
      
      // Upload vers Vercel Blob
      const blob = await put(blobPath, imageBuffer, {
        access: 'public',
        contentType: contentType
      })
      
      return {
        success: true,
        newUrl: blob.url
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  private getFileExtension(contentType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg'
    }
    
    return extensions[contentType] || '.jpg'
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private printFinalStats() {
    console.log('\n📊 Statistiques finales de l\'upload organisé:')
    console.log(`📁 Entités traitées: ${this.progress.processedEntities}`)
    console.log(`🖼️  Images totales: ${this.progress.totalImages}`)
    console.log(`✅ Images uploadées: ${this.progress.uploadedImages}`)
    console.log(`❌ Images échouées: ${this.progress.failedImages}`)
    console.log(`📈 Taux de succès: ${((this.progress.uploadedImages / this.progress.totalImages) * 100).toFixed(2)}%`)
    
    console.log('\n📂 Structure des dossiers sur Vercel Blob:')
    console.log('  📁 establishments/')
    console.log('    📁 [establishment-id]/')
    console.log('      🖼️  image-1.jpg')
    console.log('      🖼️  image-2.jpg')
    console.log('      ...')
    console.log('  📁 partners/')
    console.log('    📁 [partner-id]/')
    console.log('      🖼️  image-[media-id].jpg')
    console.log('      🖼️  image-[media-id].png')
    console.log('      ...')
  }
}

// Exécution du script
if (require.main === module) {
  const uploader = new OrganizedImageUploader(3, 500) // 3 entités par batch, 500ms entre les uploads
  
  uploader.uploadAllImages()
    .then(() => {
      console.log('🎉 Upload organisé terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { OrganizedImageUploader }

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

class PartnerImageUploader {
  private progress: UploadProgress
  private batchSize = 10
  private delayBetweenRequests = 1000 // 1 seconde entre chaque upload

  constructor() {
    this.progress = {
      totalEntities: 0,
      processedEntities: 0,
      totalImages: 0,
      uploadedImages: 0,
      failedImages: 0,
      currentEntity: '',
      currentImage: ''
    }
  }

  async uploadPartnerImages() {
    console.log('🤝 Upload des images de partenaires...')
    
    // Récupérer tous les storefronts de partenaires avec des images
    const storefrontsWithImages = await prisma.partnerStorefront.findMany({
      where: {
        images: {
          isEmpty: false
        },
        partnerId: {
          not: null
        }
      },
      include: {
        partner: {
          select: {
            companyName: true
          }
        }
      }
    })
    
    this.progress.totalEntities = storefrontsWithImages.length
    console.log(`📊 ${storefrontsWithImages.length} storefronts de partenaires avec images à traiter`)
    
    for (let storefrontIndex = 0; storefrontIndex < storefrontsWithImages.length; storefrontIndex++) {
      const storefront = storefrontsWithImages[storefrontIndex]
      this.progress.currentEntity = storefront.partner?.companyName || 'Partenaire inconnu'
      const totalImages = storefront.images.length
      
      console.log(`\n📁 [${storefrontIndex + 1}/${storefrontsWithImages.length}] Traitement: ${this.progress.currentEntity} (${totalImages} images)`)
      
      const newImageUrls: string[] = []
      
      for (let i = 0; i < storefront.images.length; i++) {
        const imageUrl = storefront.images[i]
        this.progress.currentImage = `Image ${i + 1}/${totalImages}`
        
        // Afficher le progrès toutes les 5 images
        if (i % 5 === 0 || i === storefront.images.length - 1) {
          console.log(`  🔄 ${this.progress.currentImage} - Progrès global: ${this.progress.processedEntities}/${this.progress.totalEntities} storefronts`)
        }
        
        const result = await this.uploadImage(
          imageUrl,
          'partners',
          storefront.id,
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
      
      // Mettre à jour le storefront avec les nouvelles URLs
      await prisma.partnerStorefront.update({
        where: { id: storefront.id },
        data: { images: newImageUrls }
      })
      
      this.progress.processedEntities++
      
      // Afficher le progrès après chaque storefront
      const progressPercent = ((this.progress.processedEntities / this.progress.totalEntities) * 100).toFixed(1)
      console.log(`  📝 ${this.progress.currentEntity} mis à jour avec ${newImageUrls.length} images`)
      console.log(`  📊 Progrès: ${this.progress.processedEntities}/${this.progress.totalEntities} storefronts (${progressPercent}%)`)
      console.log(`  🖼️  Images: ${this.progress.uploadedImages} uploadées, ${this.progress.failedImages} échouées`)
    }
  }

  private async uploadImage(originalUrl: string, folder: string, entityId: string, mediaId: string) {
    try {
      // Vérifier si l'URL est déjà une URL Vercel Blob
      if (originalUrl.includes('blob.vercel-storage.com')) {
        return { success: true, newUrl: originalUrl, error: null }
      }

      // Télécharger l'image depuis l'URL originale
      const response = await fetch(originalUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const imageBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const extension = this.getFileExtension(contentType)
      
      // Générer un nom de fichier unique
      const fileName = `${entityId}_${mediaId}${extension}`
      const blobPath = `${folder}/${entityId}/${fileName}`

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
    console.log('\n📊 Statistiques finales de l\'upload des partenaires:')
    console.log(`📁 Partenaires traités: ${this.progress.processedEntities}`)
    console.log(`🖼️  Images totales: ${this.progress.totalImages}`)
    console.log(`✅ Images uploadées: ${this.progress.uploadedImages}`)
    console.log(`❌ Images échouées: ${this.progress.failedImages}`)
    console.log(`📈 Taux de succès: ${((this.progress.uploadedImages / this.progress.totalImages) * 100).toFixed(2)}%`)
    
    console.log('\n📂 Structure des dossiers sur Vercel Blob:')
    console.log('  partners/')
    console.log('  ├── {partnerId}/')
    console.log('  │   ├── {mediaId}.jpg')
    console.log('  │   └── ...')
    console.log('  └── ...')
  }

  async run() {
    try {
      console.log('🚀 Démarrage de l\'upload des images des partenaires...')
      console.log(`⚙️ Configuration: lots de ${this.batchSize} entités, délai de ${this.delayBetweenRequests}ms entre les uploads\n`)
      
      await this.uploadPartnerImages()
      
      this.printFinalStats()
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error)
    } finally {
      await prisma.$disconnect()
    }
  }
}

// Lancer le script
const uploader = new PartnerImageUploader()
uploader.run()

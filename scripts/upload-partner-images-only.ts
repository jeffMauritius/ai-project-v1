import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'

const prisma = new PrismaClient()

interface UploadProgress {
  totalPartners: number
  processedPartners: number
  totalImages: number
  uploadedImages: number
  failedImages: number
  currentPartner: string
  currentImage: string
}

interface ImageUploadResult {
  success: boolean
  newUrl?: string
  error?: string
}

class PartnerImageUploader {
  private progress: UploadProgress
  private batchSize: number
  private delayBetweenRequests: number

  constructor(batchSize = 5, delayBetweenRequests = 500) {
    this.progress = {
      totalPartners: 0,
      processedPartners: 0,
      totalImages: 0,
      uploadedImages: 0,
      failedImages: 0,
      currentPartner: '',
      currentImage: ''
    }
    this.batchSize = batchSize
    this.delayBetweenRequests = delayBetweenRequests
  }

  async uploadPartnerImages() {
    console.log('🤝 Upload des images de partenaires...')
    
    try {
      // Récupérer tous les partenaires avec des images
      const partnersWithImages = await prisma.partner.findMany({
        where: {
          images: {
            isEmpty: false
          }
        },
        select: { id: true, companyName: true, images: true }
      })

      this.progress.totalPartners = partnersWithImages.length
      this.progress.totalImages = partnersWithImages.reduce((total, partner) => total + partner.images.length, 0)

      console.log(`📊 ${this.progress.totalPartners} partenaires avec images à traiter`)
      console.log(`📊 ${this.progress.totalImages} images de partenaires à uploader`)

      if (this.progress.totalPartners === 0) {
        console.log('ℹ️  Aucun partenaire avec des images à traiter')
        return
      }

      // Traiter les partenaires par batch
      for (let i = 0; i < partnersWithImages.length; i += this.batchSize) {
        const batch = partnersWithImages.slice(i, i + this.batchSize)
        
        await Promise.all(batch.map(partner => this.processPartner(partner)))
        
        // Délai entre les batches
        if (i + this.batchSize < partnersWithImages.length) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests))
        }
      }

      this.printFinalStats()

    } catch (error) {
      console.error('❌ Erreur lors de l\'upload des images de partenaires:', error)
    } finally {
      await prisma.$disconnect()
    }
  }

  private async processPartner(partner: { id: string; companyName: string; images: string[] }) {
    this.progress.currentPartner = partner.companyName
    console.log(`📁 Traitement: ${partner.companyName} (${partner.images.length} images)`)

    const newImageUrls: string[] = []

    for (let i = 0; i < partner.images.length; i++) {
      const imageUrl = partner.images[i]
      this.progress.currentImage = `Image ${i + 1}`

      // Vérifier si l'image est déjà sur Vercel Blob
      if (imageUrl.includes('vercel-storage.com') || imageUrl.includes('blob.vercel-storage.com')) {
        console.log(`  ⏭️  Image ${i + 1}: Déjà sur Vercel Blob`)
        newImageUrls.push(imageUrl)
        continue
      }

      // Vérifier si l'image est de mariages.net
      if (!imageUrl.includes('mariages.net')) {
        console.log(`  ⏭️  Image ${i + 1}: URL non-mariages.net, ignorée`)
        newImageUrls.push(imageUrl)
        continue
      }

      const result = await this.uploadImage(imageUrl, partner.id, i + 1)
      
      if (result.success && result.newUrl) {
        newImageUrls.push(result.newUrl)
        this.progress.uploadedImages++
        console.log(`  ✅ Image ${i + 1} uploadée: ${result.newUrl}`)
      } else {
        newImageUrls.push(imageUrl) // Garder l'URL originale en cas d'échec
        this.progress.failedImages++
        console.log(`  ❌ Échec image ${i + 1}: ${result.error}`)
      }

      // Délai entre les uploads
      await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests))
    }

    // Mettre à jour le partenaire avec les nouvelles URLs
    try {
      await prisma.partner.update({
        where: { id: partner.id },
        data: { images: newImageUrls }
      })
      console.log(`  📝 ${partner.companyName} mis à jour avec ${newImageUrls.length} images`)
    } catch (error) {
      console.error(`  ❌ Erreur lors de la mise à jour de ${partner.companyName}:`, error)
    }

    this.progress.processedPartners++
    this.printProgress()
  }

  private async uploadImage(imageUrl: string, partnerId: string, imageIndex: number): Promise<ImageUploadResult> {
    try {
      // Télécharger l'image
      const response = await fetch(imageUrl)
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` }
      }

      const imageBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'

      // Générer un nom de fichier unique
      const fileExtension = contentType.includes('png') ? 'png' : 'webp'
      const fileName = `image-${imageIndex}-${Date.now()}.${fileExtension}`

      // Upload vers Vercel Blob
      const result = await put(`partners/${partnerId}/${fileName}`, imageBuffer, {
        access: 'public',
        contentType: contentType
      })

      return { success: true, newUrl: result.url }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }
    }
  }

  private printProgress() {
    const progressPercent = ((this.progress.processedPartners / this.progress.totalPartners) * 100).toFixed(2)
    const imageProgressPercent = ((this.progress.uploadedImages / this.progress.totalImages) * 100).toFixed(2)
    
    console.log(`\n📊 Progression: ${this.progress.processedPartners}/${this.progress.totalPartners} partenaires (${progressPercent}%)`)
    console.log(`📊 Images: ${this.progress.uploadedImages}/${this.progress.totalImages} uploadées (${imageProgressPercent}%)`)
    console.log(`❌ Échecs: ${this.progress.failedImages} images`)
    console.log(`🔄 En cours: ${this.progress.currentPartner} - ${this.progress.currentImage}\n`)
  }

  private printFinalStats() {
    console.log('\n🎉 Upload des images de partenaires terminé !')
    console.log('==================================================')
    console.log(`📊 Partenaires traités: ${this.progress.processedPartners}/${this.progress.totalPartners}`)
    console.log(`📊 Images uploadées: ${this.progress.uploadedImages}/${this.progress.totalImages}`)
    console.log(`❌ Images échouées: ${this.progress.failedImages}`)
    console.log(`✅ Taux de succès: ${((this.progress.uploadedImages / this.progress.totalImages) * 100).toFixed(2)}%`)
  }
}

// Exécution du script
async function main() {
  const uploader = new PartnerImageUploader()
  await uploader.uploadPartnerImages()
}

main().catch(console.error)

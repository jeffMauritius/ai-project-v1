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
  currentFile: string
}

class Partner960pUploader {
  private progress: UploadProgress
  private delayBetweenRequests = 1000 // 1 seconde entre chaque upload

  constructor() {
    this.progress = {
      totalEntities: 0,
      processedEntities: 0,
      totalImages: 0,
      uploadedImages: 0,
      failedImages: 0,
      currentEntity: '',
      currentFile: ''
    }
  }

  async uploadAllPartner960pImages() {
    console.log('📤 Début de l\'upload des images 960p des partenaires...')
    
    try {
      // Récupérer tous les partenaires depuis la base de données
      const partners = await prisma.partner.findMany({
        select: {
          id: true,
          companyName: true,
          serviceType: true
        }
      })
      
      console.log(`📊 ${partners.length} partenaires trouvés en base de données`)
      
      // Charger toutes les données JSON des partenaires
      const allJsonData = await this.loadAllPartnerJsonData()
      
      // Upload des images pour chaque partenaire
      for (let i = 0; i < partners.length; i++) {
        const partner = partners[i]
        await this.uploadPartnerImages(partner, allJsonData, i + 1, partners.length)
      }
      
      console.log('✅ Upload des images 960p des partenaires terminé !')
      this.printStats()
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload des images 960p des partenaires:', error)
      throw error
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
    
    console.log(`📊 ${allData.length} partenaires trouvés dans tous les fichiers JSON`)
    return allData
  }

  private async uploadPartnerImages(partner: any, allJsonData: any[], index: number, total: number) {
    this.progress.currentEntity = partner.companyName
    console.log(`\n📁 [${index}/${total}] Traitement de: ${partner.companyName} (${partner.id})`)
    
    // Trouver les données correspondantes dans les JSON par nom
    const jsonData = allJsonData.find(v => 
      v.name?.toLowerCase() === partner.companyName?.toLowerCase()
    )
    
    if (!jsonData) {
      console.log(`  ⚠️  Aucune donnée JSON trouvée pour ${partner.companyName}`)
      return
    }
    
    if (!jsonData.images || !Array.isArray(jsonData.images) || jsonData.images.length === 0) {
      console.log(`  ⚠️  Aucune image trouvée dans les données JSON pour ${partner.companyName}`)
      return
    }
    
    // Filtrer les URLs 960p (qui contiennent /960/)
    const images960p = jsonData.images.filter((url: string) => url.includes('/960/'))
    
    if (images960p.length === 0) {
      console.log(`  ⚠️  Aucune image 960p trouvée pour ${partner.companyName}`)
      return
    }
    
    console.log(`  📸 ${images960p.length} images 960p à uploader`)
    
    const newImageUrls: string[] = []
    
    for (let j = 0; j < images960p.length; j++) {
      const imageUrl = images960p[j]
      
      console.log(`  🔄 Upload image ${j + 1}/${images960p.length}`)
      
      const result = await this.uploadImage(
        imageUrl,
        'partners',
        partner.id,
        j + 1
      )
      
      if (result.success && result.newUrl) {
        newImageUrls.push(result.newUrl)
        this.progress.uploadedImages++
        console.log(`    ✅ Image ${j + 1} uploadée`)
      } else {
        this.progress.failedImages++
        console.log(`    ❌ Échec image ${j + 1}: ${result.error}`)
      }
      
      this.progress.totalImages++
      
      // Délai entre les uploads
      await this.delay(this.delayBetweenRequests)
    }
    
    console.log(`  📝 ${partner.companyName}: ${newImageUrls.length} images uploadées dans partners/${partner.id}/960/`)
    
    this.progress.processedEntities++
    
    // Afficher le progrès toutes les 10 partenaires
    if (index % 10 === 0 || index === total) {
      console.log(`  📊 Progrès: ${index}/${total} partenaires traités`)
      console.log(`  🖼️  Images: ${this.progress.uploadedImages} uploadées, ${this.progress.failedImages} échouées`)
    }
  }

  private async uploadImage(originalUrl: string, folder: string, partnerId: string, imageIndex: number) {
    try {
      // Vérifier si l'URL est déjà une URL Vercel Blob
      if (originalUrl.includes('blob.vercel-storage.com')) {
        return { success: true, newUrl: originalUrl, error: null }
      }

      console.log(`      📥 Téléchargement: ${originalUrl}`)
      
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

      console.log(`      📤 Upload vers: ${blobPath}`)

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
    console.log('\n📊 Statistiques d\'upload 960p des partenaires:')
    console.log(`📤 Images uploadées: ${this.progress.uploadedImages}`)
    console.log(`❌ Échecs d'upload: ${this.progress.failedImages}`)
    console.log(`📈 Taux de succès: ${((this.progress.uploadedImages / (this.progress.uploadedImages + this.progress.failedImages)) * 100).toFixed(2)}%`)
  }
}

// Exécution du script
if (require.main === module) {
  const uploader = new Partner960pUploader()
  
  uploader.uploadAllPartner960pImages()
    .then(() => {
      console.log('🎉 Upload 960p des partenaires terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { Partner960pUploader }

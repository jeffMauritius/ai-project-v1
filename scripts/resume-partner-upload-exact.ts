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
  lastProcessedId: string | null
}

class ResumablePartner960pUploader {
  private progress: UploadProgress
  private delayBetweenRequests = 1000 // 1 seconde entre chaque upload
  private progressFile: string

  constructor() {
    this.progressFile = path.join(process.cwd(), 'upload-progress.json')
    this.progress = {
      totalEntities: 0,
      processedEntities: 0,
      totalImages: 0,
      uploadedImages: 0,
      failedImages: 0,
      currentEntity: '',
      currentFile: '',
      lastProcessedId: null
    }
  }

  async uploadAllPartner960pImages(resumeFromId?: string) {
    console.log('📤 Début de l\'upload des images 960p des partenaires (avec reprise)...')
    
    try {
      // Définir l'ID de reprise
      if (resumeFromId) {
        this.progress.lastProcessedId = resumeFromId
        console.log(`🔄 Reprise exacte à partir de l'ID: ${resumeFromId}`)
      }
      
      // Charger le progrès existant
      await this.loadProgress()
      
      // Récupérer tous les partenaires depuis la base de données
      const partners = await this.getPartnersToProcess()
      
      console.log(`📊 ${partners.length} partenaires à traiter`)
      
      // Charger toutes les données JSON des partenaires
      const allJsonData = await this.loadAllPartnerJsonData()
      
      await this.processPartners(partners, allJsonData)
      
      console.log('✅ Upload des images 960p des partenaires terminé !')
      this.printFinalStats()
      
      // Nettoyer le fichier de progrès
      this.cleanupProgress()
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error)
      console.log('💾 Progrès sauvegardé. Vous pouvez reprendre avec la même commande.')
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const data = fs.readFileSync(this.progressFile, 'utf8')
        const savedProgress = JSON.parse(data)
        
        this.progress = {
          ...this.progress,
          ...savedProgress
        }
        
        console.log(`📂 Progrès chargé: ${this.progress.processedEntities} entités traitées`)
        console.log(`📤 Images uploadées: ${this.progress.uploadedImages}, Échecs: ${this.progress.failedImages}`)
      }
    } catch (error) {
      console.log('⚠️  Erreur lors du chargement du progrès')
    }
  }

  private async saveProgress() {
    try {
      fs.writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2))
    } catch (error) {
      console.error('⚠️  Erreur lors de la sauvegarde du progrès:', error)
    }
  }

  private async getPartnersToProcess() {
    // Construire la requête avec reprise
    let whereClause: any = {}
    
    if (this.progress.lastProcessedId) {
      whereClause.id = { gt: this.progress.lastProcessedId }
    }
    
    const partners = await prisma.partner.findMany({
      where: whereClause,
      select: {
        id: true,
        companyName: true,
        serviceType: true
      },
      orderBy: { id: 'asc' }
    })
    
    this.progress.totalEntities = partners.length
    return partners
  }

  private async loadAllPartnerJsonData() {
    console.log('📂 Chargement des données JSON des partenaires...')
    
    const jsonFiles = [
      'beauty.json', 'caterers.json', 'decorators.json', 'dresses.json',
      'entertainment.json', 'florist-decoration.json', 'florists.json',
      'gifts.json', 'honeymoon.json', 'invitations.json', 'jewelry.json',
      'music-vendors.json', 'officiants.json', 'organization.json',
      'photographers.json', 'suits.json', 'transport.json', 'videographers.json',
      'wedding-cakes.json', 'wine-spirits.json'
    ]
    
    const allData: any[] = []
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(process.cwd(), 'data', file)
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8')
          const data = JSON.parse(content)
          
          if (Array.isArray(data)) {
            allData.push(...data)
          } else if (data && Array.isArray(data[Object.keys(data)[0]])) {
            allData.push(...data[Object.keys(data)[0]])
          }
        }
      } catch (error) {
        console.error(`⚠️  Erreur lors du chargement de ${file}:`, error)
      }
    }
    
    console.log(`📊 ${allData.length} entrées JSON chargées`)
    return allData
  }

  private async processPartners(partners: any[], allJsonData: any[]) {
    for (const partner of partners) {
      this.progress.currentEntity = partner.companyName
      this.progress.lastProcessedId = partner.id
      
      console.log(`📍 [${this.progress.processedEntities + 1}/${this.progress.totalEntities}] Traitement de: ${partner.companyName} (${partner.id})`)
      
      // Trouver les données JSON correspondantes
      const jsonData = allJsonData.find(item => 
        item.companyName === partner.companyName || 
        item.name === partner.companyName
      )
      
      if (!jsonData || !jsonData.images || !Array.isArray(jsonData.images)) {
        console.log(`  ⚠️  Aucune donnée JSON trouvée pour ${partner.companyName}`)
        this.progress.processedEntities++
        continue
      }
      
      console.log(`  📸 ${jsonData.images.length} images à traiter`)
      
      const uploadedImages: string[] = []
      
      for (let i = 0; i < jsonData.images.length; i++) {
        const imageUrl = jsonData.images[i]
        this.progress.currentFile = imageUrl
        
        try {
          const blobUrl = await this.uploadImage(partner.id, imageUrl, i + 1)
          uploadedImages.push(blobUrl)
          this.progress.uploadedImages++
          console.log(`    ✅ Image ${i + 1}/${jsonData.images.length} uploadée`)
        } catch (error) {
          this.progress.failedImages++
          console.log(`    ❌ Échec image ${i + 1}: ${error}`)
        }
        
        // Délai entre les uploads
        await this.delay(this.delayBetweenRequests)
      }
      
      // Mettre à jour la base de données avec les nouvelles URLs
      if (uploadedImages.length > 0) {
        try {
          await prisma.partner.update({
            where: { id: partner.id },
            data: { images: uploadedImages }
          })
          console.log(`  💾 ${uploadedImages.length} URLs sauvegardées en base`)
        } catch (error) {
          console.log(`  ⚠️  Erreur lors de la sauvegarde en base: ${error}`)
        }
      }
      
      this.progress.processedEntities++
      
      // Sauvegarder le progrès tous les 10 partenaires
      if (this.progress.processedEntities % 10 === 0) {
        await this.saveProgress()
      }
      
      // Afficher le progrès tous les 50 partenaires
      if (this.progress.processedEntities % 50 === 0) {
        const percentage = ((this.progress.processedEntities / this.progress.totalEntities) * 100).toFixed(1)
        console.log(`📈 Progrès: ${this.progress.processedEntities}/${this.progress.totalEntities} (${percentage}%) - Images: ${this.progress.uploadedImages}, Échecs: ${this.progress.failedImages}`)
      }
    }
  }

  private async uploadImage(partnerId: string, imageUrl: string, imageIndex: number): Promise<string> {
    try {
      // Télécharger l'image
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.mariages.net/',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const imageBuffer = await response.arrayBuffer()
      
      // Déterminer l'extension du fichier
      const urlPath = new URL(imageUrl).pathname
      const extension = path.extname(urlPath) || '.jpg'
      
      // Nom du fichier
      const fileName = `image-${imageIndex}${extension}`
      
      // Upload vers Vercel Blob
      const blob = await put(`partners/${partnerId}/960/${fileName}`, imageBuffer, {
        access: 'public',
        contentType: response.headers.get('content-type') || 'image/jpeg'
      })
      
      return blob.url
      
    } catch (error) {
      throw new Error(`Erreur upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private printFinalStats() {
    console.log('\n📊 Statistiques finales de l\'upload:')
    console.log(`📍 Entités traitées: ${this.progress.processedEntities}`)
    console.log(`📤 Images uploadées: ${this.progress.uploadedImages}`)
    console.log(`❌ Images échouées: ${this.progress.failedImages}`)
    console.log(`📈 Taux de succès: ${((this.progress.uploadedImages / (this.progress.uploadedImages + this.progress.failedImages)) * 100).toFixed(2)}%`)
  }

  private cleanupProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        fs.unlinkSync(this.progressFile)
        console.log('🗑️  Fichier de progrès nettoyé')
      }
    } catch (error) {
      console.error('⚠️  Erreur lors du nettoyage:', error)
    }
  }
}

// Exécution du script
if (require.main === module) {
  const resumeFromId = process.argv[2] // Premier argument = ID de reprise
  
  const uploader = new ResumablePartner960pUploader()
  
  uploader.uploadAllPartner960pImages(resumeFromId)
    .then(() => {
      console.log('🎉 Upload des images 960p des partenaires terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { ResumablePartner960pUploader }
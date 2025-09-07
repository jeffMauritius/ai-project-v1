import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface PartnerData {
  name: string
  images?: string[]
  [key: string]: any
}

interface MigrationProgress {
  totalPartners: number
  processedPartners: number
  updatedPartners: number
  skippedPartners: number
  currentPartner: string
}

class PartnerImagesMigrator {
  private progress: MigrationProgress
  private partnerDataMap: Map<string, PartnerData>

  constructor() {
    this.progress = {
      totalPartners: 0,
      processedPartners: 0,
      updatedPartners: 0,
      skippedPartners: 0,
      currentPartner: ''
    }
    this.partnerDataMap = new Map()
  }

  async migratePartnerImages() {
    console.log('📸 Début de la migration des images de partenaires...')
    
    try {
      // Charger les données JSON des partenaires
      await this.loadPartnerData()
      
      // Migrer les images
      await this.migrateImages()
      
      console.log('✅ Migration des images de partenaires terminée !')
      this.printFinalStats()
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async loadPartnerData() {
    console.log('📂 Chargement des données JSON des partenaires...')
    
    const dataDir = path.join(process.cwd(), 'data')
    const jsonFiles = [
      'photographers.json',
      'videographers.json',
      'caterers.json',
      'florists.json',
      'music-vendors.json',
      'beauty.json',
      'dresses.json',
      'suits.json',
      'jewelry.json',
      'invitations.json',
      'decorators.json',
      'entertainment.json',
      'transport.json',
      'officiants.json',
      'wedding-cakes.json',
      'wine-spirits.json',
      'gifts.json',
      'honeymoon.json',
      'organization.json'
    ]

    let totalLoaded = 0

    for (const file of jsonFiles) {
      const filePath = path.join(dataDir, file)
      
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
          
          // Les données JSON ont une structure { "vendors": [...] }
          const vendors = data.vendors || data
          
          if (Array.isArray(vendors)) {
            for (const partner of vendors) {
              if (partner.name && partner.images && Array.isArray(partner.images) && partner.images.length > 0) {
                this.partnerDataMap.set(partner.name, partner)
                totalLoaded++
              }
            }
          }
          
          console.log(`  ✅ ${file}: ${Array.isArray(vendors) ? vendors.length : 0} entrées`)
        } catch (error) {
          console.log(`  ❌ Erreur lors du chargement de ${file}:`, error)
        }
      } else {
        console.log(`  ⚠️  Fichier non trouvé: ${file}`)
      }
    }

    console.log(`📊 Total partenaires avec images chargés: ${totalLoaded}`)
    
    // Debug: afficher quelques exemples
    if (totalLoaded > 0) {
      console.log('🔍 Exemples de partenaires chargés:')
      let count = 0
      for (const [name, data] of this.partnerDataMap.entries()) {
        if (count < 5) {
          console.log(`  - ${name}: ${data.images?.length || 0} images`)
          count++
        } else {
          break
        }
      }
    }
  }

  private async migrateImages() {
    console.log('🔄 Migration des images vers la base de données...')
    
    // Récupérer tous les partenaires
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        images: true
      }
    })

    this.progress.totalPartners = partners.length
    console.log(`📊 ${partners.length} partenaires à traiter`)

    for (const partner of partners) {
      this.progress.currentPartner = partner.companyName
      console.log(`📍 Traitement: ${partner.companyName}`)

      // Chercher les données correspondantes
      const partnerData = this.findMatchingPartnerData(partner.companyName)
      
      if (partnerData && partnerData.images && partnerData.images.length > 0) {
        // Vérifier si le partenaire a déjà des images
        if (partner.images.length === 0) {
          // Mettre à jour avec les nouvelles images
          await prisma.partner.update({
            where: { id: partner.id },
            data: { images: partnerData.images }
          })
          
          this.progress.updatedPartners++
          console.log(`  ✅ ${partnerData.images.length} images ajoutées (trouvé: ${partnerData.name})`)
        } else {
          this.progress.skippedPartners++
          console.log(`  ⏭️  Déjà ${partner.images.length} images, ignoré`)
        }
      } else {
        this.progress.skippedPartners++
        console.log(`  ⏭️  Aucune image trouvée dans les données JSON`)
      }

      this.progress.processedPartners++
    }
  }

  private findMatchingPartnerData(companyName: string): PartnerData | undefined {
    // Essayer de trouver une correspondance exacte
    let partnerData = this.partnerDataMap.get(companyName)
    
    if (partnerData) {
      return partnerData
    }

    // Essayer de trouver une correspondance partielle (insensible à la casse)
    for (const [name, data] of this.partnerDataMap.entries()) {
      const normalizedName = name.toLowerCase().trim()
      const normalizedCompanyName = companyName.toLowerCase().trim()
      
      // Correspondance exacte
      if (normalizedName === normalizedCompanyName) {
        return data
      }
      
      // Correspondance partielle (l'un contient l'autre)
      if (normalizedName.includes(normalizedCompanyName) || 
          normalizedCompanyName.includes(normalizedName)) {
        return data
      }
      
      // Correspondance par mots clés (prendre les premiers mots)
      const nameWords = normalizedName.split(' ').slice(0, 2)
      const companyWords = normalizedCompanyName.split(' ').slice(0, 2)
      
      if (nameWords.some(word => companyWords.includes(word)) ||
          companyWords.some(word => nameWords.includes(word))) {
        return data
      }
    }

    return undefined
  }

  private printFinalStats() {
    console.log('\n📊 Statistiques finales de la migration:')
    console.log(`📍 Partenaires traités: ${this.progress.processedPartners}`)
    console.log(`✅ Partenaires mis à jour: ${this.progress.updatedPartners}`)
    console.log(`⏭️  Partenaires ignorés: ${this.progress.skippedPartners}`)
    console.log(`📈 Taux de mise à jour: ${((this.progress.updatedPartners / this.progress.processedPartners) * 100).toFixed(2)}%`)
  }
}

// Exécution du script
if (require.main === module) {
  const migrator = new PartnerImagesMigrator()
  
  migrator.migratePartnerImages()
    .then(() => {
      console.log('🎉 Migration terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { PartnerImagesMigrator }

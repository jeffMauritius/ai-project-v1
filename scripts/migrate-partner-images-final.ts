import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface PartnerData {
  name: string
  images?: string[]
  [key: string]: any
}

class PartnerImagesMigratorFinal {
  private partnerDataMap: Map<string, PartnerData>

  constructor() {
    this.partnerDataMap = new Map()
  }

  async migratePartnerImages() {
    console.log('📸 MIGRATION FINALE DES IMAGES PARTENAIRES')
    console.log('==================================================')
    
    try {
      // 1. Charger les données JSON
      await this.loadPartnerData()
      
      // 2. Migrer les images par lots
      await this.migrateImagesInBatches()
      
    } catch (error) {
      console.error('❌ Erreur:', error)
    } finally {
      await prisma.$disconnect()
    }
  }

  private async loadPartnerData() {
    console.log('📂 Chargement des données JSON...')
    
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
          console.log(`  ❌ Erreur ${file}:`, error.message)
        }
      }
    }

    console.log(`📊 Total partenaires avec images chargés: ${totalLoaded}`)
  }

  private async migrateImagesInBatches() {
    console.log('\n🔄 MIGRATION DES IMAGES PAR LOTS')
    console.log('==================================================')
    
    const batchSize = 100
    let skip = 0
    let totalUpdated = 0
    let totalMatched = 0
    let totalNotMatched = 0
    
    while (true) {
      // Récupérer un lot de partenaires
      const partners = await prisma.partner.findMany({
        skip: skip,
        take: batchSize,
        select: {
          id: true,
          companyName: true,
          images: true
        }
      })
      
      if (partners.length === 0) {
        break
      }
      
      console.log(`\n📦 Lot ${Math.floor(skip / batchSize) + 1}: ${partners.length} partenaires`)
      
      let batchUpdated = 0
      let batchMatched = 0
      let batchNotMatched = 0
      
      for (const partner of partners) {
        // Traiter seulement les partenaires sans images
        if (partner.images.length === 0) {
          const partnerData = this.findMatchingPartnerData(partner.companyName)
          
          if (partnerData && partnerData.images && partnerData.images.length > 0) {
            // Mettre à jour le partenaire
            await prisma.partner.update({
              where: { id: partner.id },
              data: { images: partnerData.images }
            })
            
            batchUpdated++
            totalUpdated++
            batchMatched++
            totalMatched++
            
            console.log(`  ✅ ${partner.companyName} -> ${partnerData.name} (${partnerData.images.length} images)`)
          } else {
            batchNotMatched++
            totalNotMatched++
          }
        }
      }
      
      console.log(`  📊 Lot: ${batchUpdated} mis à jour, ${batchMatched} matches, ${batchNotMatched} pas de match`)
      
      skip += batchSize
      
      // Afficher le progrès global
      if (totalUpdated % 500 === 0 && totalUpdated > 0) {
        console.log(`\n📈 PROGRÈS: ${totalUpdated} partenaires mis à jour au total`)
      }
    }
    
    console.log(`\n📊 RÉSULTATS FINAUX:`)
    console.log(`  ✅ Partenaires mis à jour: ${totalUpdated}`)
    console.log(`  🔍 Matches trouvés: ${totalMatched}`)
    console.log(`  ❌ Pas de match: ${totalNotMatched}`)
    console.log(`  📈 Taux de succès: ${totalMatched > 0 ? ((totalMatched / (totalMatched + totalNotMatched)) * 100).toFixed(2) : '0.00'}%`)
  }

  private findMatchingPartnerData(companyName: string): PartnerData | undefined {
    // 1. Correspondance exacte
    let partnerData = this.partnerDataMap.get(companyName)
    if (partnerData) return partnerData

    // 2. Correspondance insensible à la casse
    const normalizedCompanyName = companyName.toLowerCase().trim()
    for (const [name, data] of this.partnerDataMap.entries()) {
      const normalizedName = name.toLowerCase().trim()
      
      if (normalizedName === normalizedCompanyName) {
        return data
      }
      
      // 3. Correspondance partielle
      if (normalizedName.includes(normalizedCompanyName) || 
          normalizedCompanyName.includes(normalizedName)) {
        return data
      }
      
      // 4. Correspondance par mots clés
      const nameWords = normalizedName.split(' ').filter(w => w.length > 2)
      const companyWords = normalizedCompanyName.split(' ').filter(w => w.length > 2)
      
      if (nameWords.length > 0 && companyWords.length > 0) {
        const commonWords = nameWords.filter(word => companyWords.includes(word))
        if (commonWords.length >= Math.min(nameWords.length, companyWords.length) * 0.5) {
          return data
        }
      }
    }

    return undefined
  }
}

// Exécution
if (require.main === module) {
  const migrator = new PartnerImagesMigratorFinal()
  migrator.migratePartnerImages()
    .then(() => {
      console.log('\n🎉 Migration terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

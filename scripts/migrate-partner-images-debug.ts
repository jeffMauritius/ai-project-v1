import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface PartnerData {
  name: string
  images?: string[]
  [key: string]: any
}

class PartnerImagesMigratorDebug {
  private partnerDataMap: Map<string, PartnerData>

  constructor() {
    this.partnerDataMap = new Map()
  }

  async analyzeAndMigrate() {
    console.log('🔍 ANALYSE ET MIGRATION DES IMAGES PARTENAIRES')
    console.log('==================================================')
    
    try {
      // 1. Charger les données JSON
      await this.loadPartnerData()
      
      // 2. Analyser les partenaires sans images
      await this.analyzePartnersWithoutImages()
      
      // 3. Tester le matching sur quelques exemples
      await this.testMatching()
      
      // 4. Migrer avec plus de debug
      await this.migrateWithDebug()
      
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

  private async analyzePartnersWithoutImages() {
    console.log('\n🔍 ANALYSE DES PARTENAIRES SANS IMAGES')
    console.log('==================================================')
    
    const partnersWithoutImages = await prisma.partner.findMany({
      where: {
        images: {
          isEmpty: true
        }
      },
      select: {
        id: true,
        companyName: true,
        serviceType: true
      },
      take: 20 // Analyser seulement les 20 premiers
    })

    console.log(`📊 ${partnersWithoutImages.length} premiers partenaires sans images:`)
    
    for (const partner of partnersWithoutImages) {
      const match = this.findMatchingPartnerData(partner.companyName)
      console.log(`  ${partner.companyName} (${partner.serviceType})`)
      if (match) {
        console.log(`    ✅ MATCH: ${match.name} (${match.images?.length} images)`)
      } else {
        console.log(`    ❌ PAS DE MATCH`)
      }
    }
  }

  private async testMatching() {
    console.log('\n🧪 TEST DU MATCHING')
    console.log('==================================================')
    
    // Prendre quelques exemples de noms dans les JSON
    let count = 0
    for (const [name, data] of this.partnerDataMap.entries()) {
      if (count < 10) {
        console.log(`JSON: "${name}" (${data.images?.length} images)`)
        count++
      } else {
        break
      }
    }
  }

  private async migrateWithDebug() {
    console.log('\n🔄 MIGRATION AVEC DEBUG')
    console.log('==================================================')
    
    const partners = await prisma.partner.findMany({
      where: {
        images: {
          isEmpty: true
        }
      },
      select: {
        id: true,
        companyName: true,
        images: true
      }
    })

    console.log(`📊 ${partners.length} partenaires sans images à traiter`)
    
    let updated = 0
    let matched = 0
    let notMatched = 0

    for (const partner of partners) {
      const partnerData = this.findMatchingPartnerData(partner.companyName)
      
      if (partnerData && partnerData.images && partnerData.images.length > 0) {
        matched++
        
        // Mettre à jour seulement les premiers pour tester
        if (updated < 100) {
          await prisma.partner.update({
            where: { id: partner.id },
            data: { images: partnerData.images }
          })
          updated++
          console.log(`  ✅ ${partner.companyName} -> ${partnerData.name} (${partnerData.images.length} images)`)
        }
      } else {
        notMatched++
        if (notMatched <= 10) {
          console.log(`  ❌ ${partner.companyName} - PAS DE MATCH`)
        }
      }
    }

    console.log(`\n📊 RÉSULTATS:`)
    console.log(`  ✅ Mis à jour: ${updated}`)
    console.log(`  🔍 Matches trouvés: ${matched}`)
    console.log(`  ❌ Pas de match: ${notMatched}`)
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
  const migrator = new PartnerImagesMigratorDebug()
  migrator.analyzeAndMigrate()
}

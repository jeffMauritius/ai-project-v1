import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface PartnerData {
  name: string
  images?: string[]
  [key: string]: any
}

class PartnerImagesMigratorFixed {
  private partnerDataMap: Map<string, PartnerData>

  constructor() {
    this.partnerDataMap = new Map()
  }

  async migratePartnerImages() {
    console.log('📸 MIGRATION DES IMAGES PARTENAIRES - VERSION CORRIGÉE')
    console.log('==================================================')
    
    try {
      // 1. Charger les données JSON
      await this.loadPartnerData()
      
      // 2. Compter les partenaires sans images
      await this.countPartnersWithoutImages()
      
      // 3. Migrer les images
      await this.migrateImages()
      
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

  private async countPartnersWithoutImages() {
    console.log('\n🔍 ANALYSE DES PARTENAIRES')
    console.log('==================================================')
    
    const totalPartners = await prisma.partner.count()
    const partnersWithImages = await prisma.partner.count({
      where: {
        images: {
          isEmpty: false
        }
      }
    })
    
    console.log(`📊 Total partenaires: ${totalPartners}`)
    console.log(`📊 Partenaires avec images: ${partnersWithImages}`)
    console.log(`📊 Partenaires sans images: ${totalPartners - partnersWithImages}`)
  }

  private async migrateImages() {
    console.log('\n🔄 MIGRATION DES IMAGES')
    console.log('==================================================')
    
    // Récupérer tous les partenaires sans images
    const partners = await prisma.partner.findMany({
      where: {
        OR: [
          { images: { isEmpty: true } },
          { images: { equals: [] } }
        ]
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
        
        // Mettre à jour le partenaire
        await prisma.partner.update({
          where: { id: partner.id },
          data: { images: partnerData.images }
        })
        
        updated++
        
        if (updated % 100 === 0) {
          console.log(`  ✅ ${updated}/${partners.length} partenaires mis à jour`)
        }
      } else {
        notMatched++
      }
    }

    console.log(`\n📊 RÉSULTATS FINAUX:`)
    console.log(`  ✅ Partenaires mis à jour: ${updated}`)
    console.log(`  🔍 Matches trouvés: ${matched}`)
    console.log(`  ❌ Pas de match: ${notMatched}`)
    console.log(`  📈 Taux de succès: ${((matched / partners.length) * 100).toFixed(2)}%`)
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
  const migrator = new PartnerImagesMigratorFixed()
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

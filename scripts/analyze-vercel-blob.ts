import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

interface BlobAnalysis {
  establishments: {
    total: number
    withImages: number
    withoutImages: number
    byType: Record<string, { total: number, withImages: number, withoutImages: number }>
  }
  partners: {
    total: number
    withImages: number
    withoutImages: number
    byServiceType: Record<string, { total: number, withImages: number, withoutImages: number }>
  }
}

class VercelBlobAnalyzer {
  private analysis: BlobAnalysis

  constructor() {
    this.analysis = {
      establishments: {
        total: 0,
        withImages: 0,
        withoutImages: 0,
        byType: {}
      },
      partners: {
        total: 0,
        withImages: 0,
        withoutImages: 0,
        byServiceType: {}
      }
    }
  }

  async analyzeBlobStorage() {
    console.log('🔍 Analyse du stockage Vercel Blob...')
    
    try {
      // Récupérer tous les établissements
      const establishments = await prisma.establishment.findMany({
        select: {
          id: true,
          type: true,
          images: true
        }
      })
      
      // Récupérer tous les partenaires
      const partners = await prisma.partner.findMany({
        select: {
          id: true,
          serviceType: true,
          images: true
        }
      })
      
      console.log(`📊 ${establishments.length} établissements trouvés`)
      console.log(`📊 ${partners.length} partenaires trouvés`)
      
      // Analyser les établissements
      await this.analyzeEstablishments(establishments)
      
      // Analyser les partenaires
      await this.analyzePartners(partners)
      
      // Afficher les résultats
      this.printAnalysis()
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async analyzeEstablishments(establishments: any[]) {
    console.log('🏰 Analyse des établissements...')
    
    this.analysis.establishments.total = establishments.length
    
    for (const establishment of establishments) {
      const type = establishment.type || 'Non défini'
      
      // Initialiser le type s'il n'existe pas
      if (!this.analysis.establishments.byType[type]) {
        this.analysis.establishments.byType[type] = {
          total: 0,
          withImages: 0,
          withoutImages: 0
        }
      }
      
      this.analysis.establishments.byType[type].total++
      
      // Vérifier si l'établissement a des images
      if (establishment.images && establishment.images.length > 0) {
        this.analysis.establishments.withImages++
        this.analysis.establishments.byType[type].withImages++
      } else {
        this.analysis.establishments.withoutImages++
        this.analysis.establishments.byType[type].withoutImages++
      }
    }
  }

  private async analyzePartners(partners: any[]) {
    console.log('🤝 Analyse des partenaires...')
    
    this.analysis.partners.total = partners.length
    
    for (const partner of partners) {
      const serviceType = partner.serviceType || 'Non défini'
      
      // Initialiser le type de service s'il n'existe pas
      if (!this.analysis.partners.byServiceType[serviceType]) {
        this.analysis.partners.byServiceType[serviceType] = {
          total: 0,
          withImages: 0,
          withoutImages: 0
        }
      }
      
      this.analysis.partners.byServiceType[serviceType].total++
      
      // Vérifier si le partenaire a des images
      if (partner.images && partner.images.length > 0) {
        this.analysis.partners.withImages++
        this.analysis.partners.byServiceType[serviceType].withImages++
      } else {
        this.analysis.partners.withoutImages++
        this.analysis.partners.byServiceType[serviceType].withoutImages++
      }
    }
  }

  private printAnalysis() {
    console.log('\n' + '='.repeat(80))
    console.log('📊 ANALYSE DU STOCKAGE VERCEL BLOB')
    console.log('='.repeat(80))
    
    // Analyse des établissements
    console.log('\n🏰 ÉTABLISSEMENTS:')
    console.log(`   Total: ${this.analysis.establishments.total}`)
    console.log(`   Avec images: ${this.analysis.establishments.withImages} (${((this.analysis.establishments.withImages / this.analysis.establishments.total) * 100).toFixed(1)}%)`)
    console.log(`   Sans images: ${this.analysis.establishments.withoutImages} (${((this.analysis.establishments.withoutImages / this.analysis.establishments.total) * 100).toFixed(1)}%)`)
    
    console.log('\n   📋 Par type:')
    const sortedEstablishmentTypes = Object.entries(this.analysis.establishments.byType)
      .sort(([,a], [,b]) => b.total - a.total)
    
    for (const [type, stats] of sortedEstablishmentTypes) {
      const withImagesPercent = ((stats.withImages / stats.total) * 100).toFixed(1)
      const withoutImagesPercent = ((stats.withoutImages / stats.total) * 100).toFixed(1)
      
      console.log(`   • ${type}:`)
      console.log(`     - Total: ${stats.total}`)
      console.log(`     - Avec images: ${stats.withImages} (${withImagesPercent}%)`)
      console.log(`     - Sans images: ${stats.withoutImages} (${withoutImagesPercent}%)`)
    }
    
    // Analyse des partenaires
    console.log('\n🤝 PARTENAIRES:')
    console.log(`   Total: ${this.analysis.partners.total}`)
    console.log(`   Avec images: ${this.analysis.partners.withImages} (${((this.analysis.partners.withImages / this.analysis.partners.total) * 100).toFixed(1)}%)`)
    console.log(`   Sans images: ${this.analysis.partners.withoutImages} (${((this.analysis.partners.withoutImages / this.analysis.partners.total) * 100).toFixed(1)}%)`)
    
    console.log('\n   📋 Par type de service:')
    const sortedPartnerTypes = Object.entries(this.analysis.partners.byServiceType)
      .sort(([,a], [,b]) => b.total - a.total)
    
    for (const [serviceType, stats] of sortedPartnerTypes) {
      const withImagesPercent = ((stats.withImages / stats.total) * 100).toFixed(1)
      const withoutImagesPercent = ((stats.withoutImages / stats.total) * 100).toFixed(1)
      
      console.log(`   • ${serviceType}:`)
      console.log(`     - Total: ${stats.total}`)
      console.log(`     - Avec images: ${stats.withImages} (${withImagesPercent}%)`)
      console.log(`     - Sans images: ${stats.withoutImages} (${withoutImagesPercent}%)`)
    }
    
    // Résumé global
    console.log('\n' + '='.repeat(80))
    console.log('📈 RÉSUMÉ GLOBAL:')
    const totalEntities = this.analysis.establishments.total + this.analysis.partners.total
    const totalWithImages = this.analysis.establishments.withImages + this.analysis.partners.withImages
    const totalWithoutImages = this.analysis.establishments.withoutImages + this.analysis.partners.withoutImages
    
    console.log(`   Total entités: ${totalEntities}`)
    console.log(`   Avec images: ${totalWithImages} (${((totalWithImages / totalEntities) * 100).toFixed(1)}%)`)
    console.log(`   Sans images: ${totalWithoutImages} (${((totalWithoutImages / totalEntities) * 100).toFixed(1)}%)`)
    console.log('='.repeat(80))
  }
}

// Exécution du script
if (require.main === module) {
  const analyzer = new VercelBlobAnalyzer()
  
  analyzer.analyzeBlobStorage()
    .then(() => {
      console.log('🎉 Analyse terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { VercelBlobAnalyzer }

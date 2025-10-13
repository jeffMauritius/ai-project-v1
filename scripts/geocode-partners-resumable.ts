import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface GeocodingResult {
  latitude: number
  longitude: number
  success: boolean
  error?: string
}

interface GeocodingProgress {
  totalPartners: number
  processedPartners: number
  successfulGeocoding: number
  failedGeocoding: number
  currentPartner: string
  lastProcessedId: string | null
}

class ResumablePartnerGeocoder {
  private progress: GeocodingProgress
  private batchSize: number
  private delayBetweenRequests: number
  private progressFile: string

  constructor(batchSize = 5, delayBetweenRequests = 1000) {
    this.progressFile = path.join(process.cwd(), 'geocoding-progress.json')
    this.batchSize = batchSize
    this.delayBetweenRequests = delayBetweenRequests
    this.progress = {
      totalPartners: 0,
      processedPartners: 0,
      successfulGeocoding: 0,
      failedGeocoding: 0,
      currentPartner: '',
      lastProcessedId: null
    }
  }

  async geocodeAllPartners() {
    console.log('🤝 Début de la géolocalisation des partenaires (avec reprise)...')
    
    try {
      // Charger le progrès existant ou initialiser
      await this.loadProgress()
      
      await this.geocodePartners()
      
      console.log('✅ Géolocalisation des partenaires terminée !')
      this.printFinalStats()
      
      // Nettoyer le fichier de progrès
      this.cleanupProgress()
      
    } catch (error) {
      console.error('❌ Erreur lors de la géolocalisation:', error)
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
        
        console.log(`📂 Progrès chargé: ${this.progress.processedPartners}/${this.progress.totalPartners} partenaires traités`)
        console.log(`✅ Succès: ${this.progress.successfulGeocoding}, ❌ Échecs: ${this.progress.failedGeocoding}`)
        
        if (this.progress.processedPartners >= this.progress.totalPartners) {
          console.log('🎉 Géolocalisation déjà terminée !')
          process.exit(0)
        }
      } else {
        // Première exécution - compter le total
        await this.countTotalPartners()
      }
    } catch (error) {
      console.log('⚠️  Erreur lors du chargement du progrès, redémarrage depuis le début')
      await this.countTotalPartners()
    }
  }

  private async countTotalPartners() {
    this.progress.totalPartners = await prisma.partner.count({
      where: {
        OR: [
          { latitude: { isSet: false } },
          { longitude: { isSet: false } }
        ]
      }
    })
    
    console.log(`📊 ${this.progress.totalPartners} partenaires à géolocaliser`)
  }

  private async saveProgress() {
    try {
      fs.writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2))
    } catch (error) {
      console.error('⚠️  Erreur lors de la sauvegarde du progrès:', error)
    }
  }

  private async geocodePartners() {
    console.log('🤝 Géolocalisation des partenaires...')
    
    let processed = this.progress.processedPartners
    
    while (processed < this.progress.totalPartners) {
      // Construire la requête avec reprise
      let whereClause: any = {
        OR: [
          { latitude: { isSet: false } },
          { longitude: { isSet: false } }
        ]
      }
      
      // Si on reprend, commencer après le dernier ID traité
      if (this.progress.lastProcessedId) {
        whereClause.id = { gt: this.progress.lastProcessedId }
      }
      
      const partners = await prisma.partner.findMany({
        where: whereClause,
        take: this.batchSize,
        select: {
          id: true,
          companyName: true,
          billingStreet: true,
          billingCity: true,
          billingPostalCode: true,
          billingCountry: true
        },
        orderBy: { id: 'asc' }
      })
      
      if (partners.length === 0) {
        console.log('✅ Tous les partenaires ont été traités !')
        break
      }
      
      for (const partner of partners) {
        this.progress.currentPartner = partner.companyName
        this.progress.lastProcessedId = partner.id
        
        console.log(`📍 [${processed + 1}/${this.progress.totalPartners}] Géolocalisation: ${partner.companyName}`)
        
        const result = await this.geocodeAddress(
          partner.billingStreet,
          partner.billingCity,
          partner.billingPostalCode,
          partner.billingCountry
        )
        
        if (result.success) {
          await prisma.partner.update({
            where: { id: partner.id },
            data: {
              latitude: result.latitude,
              longitude: result.longitude
            }
          })
          
          this.progress.successfulGeocoding++
          console.log(`  ✅ Coordonnées: ${result.latitude}, ${result.longitude}`)
        } else {
          this.progress.failedGeocoding++
          console.log(`  ❌ Échec: ${result.error}`)
        }
        
        this.progress.processedPartners++
        processed++
        
        // Sauvegarder le progrès tous les 10 partenaires
        if (processed % 10 === 0) {
          await this.saveProgress()
        }
        
        // Délai entre les requêtes pour éviter les limites de taux
        await this.delay(this.delayBetweenRequests)
      }
      
      // Afficher le progrès tous les 50 partenaires
      if (processed % 50 === 0) {
        const percentage = ((processed / this.progress.totalPartners) * 100).toFixed(1)
        console.log(`📈 Progrès: ${processed}/${this.progress.totalPartners} (${percentage}%) - Succès: ${this.progress.successfulGeocoding}, Échecs: ${this.progress.failedGeocoding}`)
      }
    }
  }

  private async geocodeAddress(
    street: string,
    city: string,
    postalCode: string | null,
    country: string
  ): Promise<GeocodingResult> {
    try {
      // Construire l'adresse complète
      const addressParts = [street, city, postalCode, country].filter(Boolean)
      const fullAddress = addressParts.join(', ')
      
      if (!fullAddress.trim()) {
        return {
          latitude: 0,
          longitude: 0,
          success: false,
          error: 'Adresse vide'
        }
      }
      
      // Utiliser l'API de géocodage de Nominatim (OpenStreetMap) - gratuite
      const encodedAddress = encodeURIComponent(fullAddress)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=fr`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MonMariage-AI/1.0 (contact@monmariage.ai)'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data || data.length === 0) {
        return {
          latitude: 0,
          longitude: 0,
          success: false,
          error: 'Adresse non trouvée'
        }
      }
      
      const result = data[0]
      const latitude = parseFloat(result.lat)
      const longitude = parseFloat(result.lon)
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return {
          latitude: 0,
          longitude: 0,
          success: false,
          error: 'Coordonnées invalides'
        }
      }
      
      return {
        latitude,
        longitude,
        success: true
      }
      
    } catch (error) {
      return {
        latitude: 0,
        longitude: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private printFinalStats() {
    console.log('\n📊 Statistiques finales de la géolocalisation des partenaires:')
    console.log(`📍 Partenaires traités: ${this.progress.processedPartners}`)
    console.log(`✅ Géolocalisations réussies: ${this.progress.successfulGeocoding}`)
    console.log(`❌ Géolocalisations échouées: ${this.progress.failedGeocoding}`)
    console.log(`📈 Taux de succès: ${((this.progress.successfulGeocoding / this.progress.processedPartners) * 100).toFixed(2)}%`)
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
  const geocoder = new ResumablePartnerGeocoder(5, 1000) // 5 par batch, 1 seconde entre les requêtes
  
  geocoder.geocodeAllPartners()
    .then(() => {
      console.log('🎉 Géolocalisation des partenaires terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { ResumablePartnerGeocoder }


import { PrismaClient } from '@prisma/client'

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
}

class PartnerGeocoder {
  private progress: GeocodingProgress
  private batchSize: number
  private delayBetweenRequests: number

  constructor(batchSize = 5, delayBetweenRequests = 1000) {
    this.progress = {
      totalPartners: 0,
      processedPartners: 0,
      successfulGeocoding: 0,
      failedGeocoding: 0,
      currentPartner: ''
    }
    this.batchSize = batchSize
    this.delayBetweenRequests = delayBetweenRequests
  }

  async geocodeAllPartners() {
    console.log('🤝 Début de la géolocalisation des partenaires...')
    
    try {
      await this.geocodePartners()
      
      console.log('✅ Géolocalisation des partenaires terminée !')
      this.printFinalStats()
      
    } catch (error) {
      console.error('❌ Erreur lors de la géolocalisation:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async geocodePartners() {
    console.log('🤝 Géolocalisation des partenaires...')
    
    // Compter le total de partenaires sans coordonnées
    const totalPartners = await prisma.partner.count({
      where: {
        OR: [
          { latitude: { isSet: false } },
          { longitude: { isSet: false } }
        ]
      }
    })
    
    this.progress.totalPartners = totalPartners
    console.log(`📊 ${totalPartners} partenaires à géolocaliser`)
    
    if (totalPartners === 0) {
      console.log('✅ Tous les partenaires sont déjà géolocalisés !')
      return
    }
    
    let offset = 0
    let processed = 0
    
    while (processed < totalPartners) {
      const partners = await prisma.partner.findMany({
        where: {
          OR: [
            { latitude: { isSet: false } },
            { longitude: { isSet: false } }
          ]
        },
        take: this.batchSize,
        skip: offset,
        select: {
          id: true,
          companyName: true,
          billingStreet: true,
          billingCity: true,
          billingPostalCode: true,
          billingCountry: true
        }
      })
      
      if (partners.length === 0) break
      
      for (const partner of partners) {
        this.progress.currentPartner = partner.companyName
        console.log(`📍 [${processed + 1}/${totalPartners}] Géolocalisation: ${partner.companyName}`)
        
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
        
        // Délai entre les requêtes pour éviter les limites de taux
        await this.delay(this.delayBetweenRequests)
      }
      
      offset += this.batchSize
      
      // Afficher le progrès tous les 50 partenaires
      if (processed % 50 === 0) {
        const percentage = ((processed / totalPartners) * 100).toFixed(1)
        console.log(`📈 Progrès: ${processed}/${totalPartners} (${percentage}%) - Succès: ${this.progress.successfulGeocoding}, Échecs: ${this.progress.failedGeocoding}`)
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
}

// Exécution du script
if (require.main === module) {
  const geocoder = new PartnerGeocoder(5, 1000) // 5 par batch, 1 seconde entre les requêtes
  
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

export { PartnerGeocoder }

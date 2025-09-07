import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface GeocodingResult {
  latitude: number
  longitude: number
  success: boolean
  error?: string
}

interface GeocodingProgress {
  totalEntities: number
  processedEntities: number
  successfulGeocoding: number
  failedGeocoding: number
  currentEntity: string
}

class AddressGeocoder {
  private progress: GeocodingProgress
  private batchSize: number
  private delayBetweenRequests: number

  constructor(batchSize = 10, delayBetweenRequests = 1000) {
    this.progress = {
      totalEntities: 0,
      processedEntities: 0,
      successfulGeocoding: 0,
      failedGeocoding: 0,
      currentEntity: ''
    }
    this.batchSize = batchSize
    this.delayBetweenRequests = delayBetweenRequests
  }

  async geocodeAllAddresses() {
    console.log('🌍 Début de la géolocalisation des adresses...')
    
    try {
      // Géolocaliser les établissements
      await this.geocodeEstablishments()
      
      // Géolocaliser les partenaires
      await this.geocodePartners()
      
      console.log('✅ Géolocalisation terminée !')
      this.printFinalStats()
      
    } catch (error) {
      console.error('❌ Erreur lors de la géolocalisation:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async geocodeEstablishments() {
    console.log('🏛️  Géolocalisation des établissements...')
    
    // Compter le total d'établissements sans coordonnées
    const totalEstablishments = await prisma.establishment.count({
      where: {
        AND: [
          { latitude: { not: { gt: 0 } } },
          { longitude: { not: { gt: 0 } } }
        ]
      }
    })
    
    this.progress.totalEntities += totalEstablishments
    console.log(`📊 ${totalEstablishments} établissements à géolocaliser`)
    
    let offset = 0
    let processed = 0
    
    while (processed < totalEstablishments) {
      const establishments = await prisma.establishment.findMany({
        where: {
          AND: [
            { latitude: { not: { gt: 0 } } },
            { longitude: { not: { gt: 0 } } }
          ]
        },
        take: this.batchSize,
        skip: offset,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          region: true,
          country: true
        }
      })
      
      if (establishments.length === 0) break
      
      for (const establishment of establishments) {
        this.progress.currentEntity = establishment.name
        console.log(`📍 Géolocalisation: ${establishment.name}`)
        
        const result = await this.geocodeAddress(
          establishment.address,
          establishment.city,
          establishment.region,
          establishment.country
        )
        
        if (result.success) {
          await prisma.establishment.update({
            where: { id: establishment.id },
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
        
        this.progress.processedEntities++
        processed++
        
        // Délai entre les requêtes pour éviter les limites de taux
        await this.delay(this.delayBetweenRequests)
      }
      
      offset += this.batchSize
    }
  }

  private async geocodePartners() {
    console.log('🤝 Géolocalisation des partenaires...')
    
    // Compter le total de partenaires sans coordonnées
    const totalPartners = await prisma.partner.count({
      where: {
        AND: [
          { latitude: { not: { gt: 0 } } },
          { longitude: { not: { gt: 0 } } }
        ]
      }
    })
    
    this.progress.totalEntities += totalPartners
    console.log(`📊 ${totalPartners} partenaires à géolocaliser`)
    
    let offset = 0
    let processed = 0
    
    while (processed < totalPartners) {
      const partners = await prisma.partner.findMany({
        where: {
          AND: [
            { latitude: { not: { gt: 0 } } },
            { longitude: { not: { gt: 0 } } }
          ]
        },
        take: this.batchSize,
        skip: offset,
        select: {
          id: true,
          companyName: true,
          billingStreet: true,
          billingCity: true,
          billingCountry: true
        }
      })
      
      if (partners.length === 0) break
      
      for (const partner of partners) {
        this.progress.currentEntity = partner.companyName
        console.log(`📍 Géolocalisation: ${partner.companyName}`)
        
        const result = await this.geocodeAddress(
          partner.billingStreet,
          partner.billingCity,
          null, // Pas de région pour les partenaires
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
        
        this.progress.processedEntities++
        processed++
        
        // Délai entre les requêtes pour éviter les limites de taux
        await this.delay(this.delayBetweenRequests)
      }
      
      offset += this.batchSize
    }
  }

  private async geocodeAddress(
    street: string,
    city: string,
    region: string | null,
    country: string
  ): Promise<GeocodingResult> {
    try {
      // Construire l'adresse complète
      const addressParts = [street, city, region, country].filter(Boolean)
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
    console.log('\n📊 Statistiques finales de la géolocalisation:')
    console.log(`📍 Entités traitées: ${this.progress.processedEntities}`)
    console.log(`✅ Géolocalisations réussies: ${this.progress.successfulGeocoding}`)
    console.log(`❌ Géolocalisations échouées: ${this.progress.failedGeocoding}`)
    console.log(`📈 Taux de succès: ${((this.progress.successfulGeocoding / this.progress.processedEntities) * 100).toFixed(2)}%`)
  }
}

// Exécution du script
if (require.main === module) {
  const geocoder = new AddressGeocoder(5, 1000) // 5 par batch, 1 seconde entre les requêtes
  
  geocoder.geocodeAllAddresses()
    .then(() => {
      console.log('🎉 Géolocalisation terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { AddressGeocoder }

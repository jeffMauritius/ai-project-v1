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
  skippedEntities: number
  currentEntity: string
}

class AddressGeocoderV2 {
  private progress: GeocodingProgress
  private batchSize: number
  private delayBetweenRequests: number

  constructor(batchSize = 5, delayBetweenRequests = 1000) {
    this.progress = {
      totalEntities: 0,
      processedEntities: 0,
      successfulGeocoding: 0,
      failedGeocoding: 0,
      skippedEntities: 0,
      currentEntity: ''
    }
    this.batchSize = batchSize
    this.delayBetweenRequests = delayBetweenRequests
  }

  async geocodeAllAddresses() {
    console.log('🌍 Début de la géolocalisation des adresses (Version 2)...')
    
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
    
    // Récupérer TOUS les établissements
    const totalEstablishments = await prisma.establishment.count()
    this.progress.totalEntities += totalEstablishments
    console.log(`📊 ${totalEstablishments} établissements à vérifier`)
    
    let offset = 0
    let processed = 0
    
    while (processed < totalEstablishments) {
      const establishments = await prisma.establishment.findMany({
        take: this.batchSize,
        skip: offset,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          region: true,
          country: true,
          latitude: true,
          longitude: true
        }
      })
      
      if (establishments.length === 0) break
      
      for (const establishment of establishments) {
        this.progress.currentEntity = establishment.name
        console.log(`📍 Vérification: ${establishment.name}`)
        
        // Vérifier si l'établissement a déjà des coordonnées valides
        if (this.hasValidCoordinates(establishment.latitude, establishment.longitude)) {
          this.progress.skippedEntities++
          console.log(`  ⏭️  Déjà géolocalisé: ${establishment.latitude}, ${establishment.longitude}`)
        } else {
          console.log(`  🔍 Géolocalisation nécessaire...`)
          
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
    
    // Récupérer TOUS les partenaires
    const totalPartners = await prisma.partner.count()
    this.progress.totalEntities += totalPartners
    console.log(`📊 ${totalPartners} partenaires à vérifier`)
    
    let offset = 0
    let processed = 0
    
    while (processed < totalPartners) {
      const partners = await prisma.partner.findMany({
        take: this.batchSize,
        skip: offset,
        select: {
          id: true,
          companyName: true,
          billingStreet: true,
          billingCity: true,
          billingCountry: true,
          latitude: true,
          longitude: true
        }
      })
      
      if (partners.length === 0) break
      
      for (const partner of partners) {
        this.progress.currentEntity = partner.companyName
        console.log(`📍 Vérification: ${partner.companyName}`)
        
        // Vérifier si le partenaire a déjà des coordonnées valides
        if (this.hasValidCoordinates(partner.latitude, partner.longitude)) {
          this.progress.skippedEntities++
          console.log(`  ⏭️  Déjà géolocalisé: ${partner.latitude}, ${partner.longitude}`)
        } else {
          console.log(`  🔍 Géolocalisation nécessaire...`)
          
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
        }
        
        this.progress.processedEntities++
        processed++
        
        // Délai entre les requêtes pour éviter les limites de taux
        await this.delay(this.delayBetweenRequests)
      }
      
      offset += this.batchSize
    }
  }

  private hasValidCoordinates(latitude: number | null, longitude: number | null): boolean {
    return latitude !== null && longitude !== null && 
           latitude !== 0 && longitude !== 0 &&
           !isNaN(latitude) && !isNaN(longitude) &&
           latitude >= -90 && latitude <= 90 &&
           longitude >= -180 && longitude <= 180
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
    console.log(`⏭️  Entités ignorées (déjà géolocalisées): ${this.progress.skippedEntities}`)
    console.log(`❌ Géolocalisations échouées: ${this.progress.failedGeocoding}`)
    
    const totalGeocodingAttempts = this.progress.successfulGeocoding + this.progress.failedGeocoding
    if (totalGeocodingAttempts > 0) {
      console.log(`📈 Taux de succès: ${((this.progress.successfulGeocoding / totalGeocodingAttempts) * 100).toFixed(2)}%`)
    }
  }
}

// Exécution du script
if (require.main === module) {
  const geocoder = new AddressGeocoderV2(3, 1000) // 3 par batch, 1 seconde entre les requêtes
  
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

export { AddressGeocoderV2 }

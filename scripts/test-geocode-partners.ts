import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface GeocodingResult {
  latitude: number
  longitude: number
  success: boolean
  error?: string
}

class PartnerGeocoderTest {
  private delayBetweenRequests: number

  constructor(delayBetweenRequests = 1000) {
    this.delayBetweenRequests = delayBetweenRequests
  }

  async testGeocodePartners(limit: number = 10) {
    console.log(`🧪 Test de géolocalisation sur ${limit} partenaires...`)
    
    try {
      // Récupérer un échantillon de partenaires sans coordonnées
      const partners = await prisma.partner.findMany({
        where: {
          OR: [
            { latitude: { isSet: false } },
            { longitude: { isSet: false } }
          ]
        },
        take: limit,
        select: {
          id: true,
          companyName: true,
          billingStreet: true,
          billingCity: true,
          billingPostalCode: true,
          billingCountry: true
        }
      })
      
      console.log(`📊 ${partners.length} partenaires trouvés pour le test`)
      
      let successCount = 0
      let failCount = 0
      
      for (let i = 0; i < partners.length; i++) {
        const partner = partners[i]
        console.log(`\n📍 [${i + 1}/${partners.length}] Test: ${partner.companyName}`)
        console.log(`   Adresse: ${partner.billingStreet}, ${partner.billingCity}`)
        
        const result = await this.geocodeAddress(
          partner.billingStreet,
          partner.billingCity,
          partner.billingPostalCode,
          partner.billingCountry
        )
        
        if (result.success) {
          successCount++
          console.log(`   ✅ Coordonnées: ${result.latitude}, ${result.longitude}`)
          
          // Optionnel: mettre à jour en base pour le test
          // await prisma.partner.update({
          //   where: { id: partner.id },
          //   data: {
          //     latitude: result.latitude,
          //     longitude: result.longitude
          //   }
          // })
        } else {
          failCount++
          console.log(`   ❌ Échec: ${result.error}`)
        }
        
        // Délai entre les requêtes
        if (i < partners.length - 1) {
          await this.delay(this.delayBetweenRequests)
        }
      }
      
      console.log('\n📊 RÉSULTATS DU TEST:')
      console.log(`✅ Succès: ${successCount}`)
      console.log(`❌ Échecs: ${failCount}`)
      console.log(`📈 Taux de succès: ${((successCount / partners.length) * 100).toFixed(1)}%`)
      
      if (successCount > 0) {
        console.log('\n💡 Le test est concluant ! Vous pouvez lancer le processus complet.')
        console.log('   Commande: npx tsx scripts/geocode-partners-only.ts')
      } else {
        console.log('\n⚠️  Aucun succès dans le test. Vérifiez les adresses ou l\'API.')
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du test:', error)
      throw error
    } finally {
      await prisma.$disconnect()
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
      
      console.log(`   🔍 Recherche: "${fullAddress}"`)
      
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
}

// Exécution du script
if (require.main === module) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 10
  
  const geocoder = new PartnerGeocoderTest(1000) // 1 seconde entre les requêtes
  
  geocoder.testGeocodePartners(limit)
    .then(() => {
      console.log('\n🎉 Test terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { PartnerGeocoderTest }

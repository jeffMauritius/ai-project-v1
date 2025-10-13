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
  resumeFromId: string | null
}

class ExactResumeGeocoder {
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
      lastProcessedId: null,
      resumeFromId: null
    }
  }

  async geocodeAllPartners(resumeFromId?: string) {
    console.log('🤝 Début de la géolocalisation des partenaires (reprise exacte)...')
    
    try {
      // Définir l'ID de reprise
      if (resumeFromId) {
        this.progress.resumeFromId = resumeFromId
        console.log(`🔄 Reprise exacte à partir de l'ID: ${resumeFromId}`)
      }
      
      // Détecter le progrès existant
      await this.detectExistingProgress()
      
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

  private async detectExistingProgress() {
    console.log('🔍 Détection du progrès existant...')
    
    // Compter le total et ceux déjà géolocalisés
    const totalPartners = await prisma.partner.count()
    const partnersWithCoords = await prisma.partner.count({
      where: {
        AND: [
          { latitude: { not: { isSet: false } } },
          { longitude: { not: { isSet: false } } }
        ]
      }
    })
    
    this.progress.totalPartners = totalPartners
    this.progress.processedPartners = partnersWithCoords
    this.progress.successfulGeocoding = partnersWithCoords
    
    console.log(`📊 ${partnersWithCoords}/${totalPartners} partenaires déjà géolocalisés (${((partnersWithCoords/totalPartners)*100).toFixed(1)}%)`)
    
    if (partnersWithCoords >= totalPartners) {
      console.log('🎉 Tous les partenaires sont déjà géolocalisés !')
      process.exit(0)
    }
    
    // Si on a un ID de reprise spécifique, l'utiliser
    if (this.progress.resumeFromId) {
      this.progress.lastProcessedId = this.progress.resumeFromId
      console.log(`🔄 Reprise exacte à partir de l'ID: ${this.progress.resumeFromId}`)
      
      // Compter combien de partenaires sont avant cet ID
      const partnersBeforeResume = await prisma.partner.count({
        where: {
          id: { lt: this.progress.resumeFromId }
        }
      })
      
      console.log(`📍 ${partnersBeforeResume} partenaires avant l'ID de reprise`)
      console.log(`📍 Reprise à partir du partenaire ${partnersBeforeResume + 1}`)
    } else {
      // Trouver le dernier ID traité pour reprendre normalement
      const lastProcessed = await prisma.partner.findFirst({
        where: {
          AND: [
            { latitude: { not: { isSet: false } } },
            { longitude: { not: { isSet: false } } }
          ]
        },
        orderBy: { id: 'desc' },
        select: { id: true }
      })
      
      if (lastProcessed) {
        this.progress.lastProcessedId = lastProcessed.id
        console.log(`🔄 Reprise après l'ID: ${lastProcessed.id}`)
      }
    }
    
    // Charger le fichier de progrès s'il existe
    await this.loadProgressFile()
  }

  private async loadProgressFile() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const data = fs.readFileSync(this.progressFile, 'utf8')
        const savedProgress = JSON.parse(data)
        
        // Fusionner avec le progrès détecté
        this.progress = {
          ...this.progress,
          ...savedProgress,
          // Garder les valeurs détectées en base
          totalPartners: this.progress.totalPartners,
          processedPartners: this.progress.processedPartners,
          successfulGeocoding: this.progress.successfulGeocoding,
          // Garder l'ID de reprise
          resumeFromId: this.progress.resumeFromId,
          lastProcessedId: this.progress.lastProcessedId
        }
        
        console.log(`📂 Progrès chargé depuis le fichier`)
        console.log(`❌ Échecs précédents: ${this.progress.failedGeocoding}`)
      }
    } catch (error) {
      console.log('⚠️  Erreur lors du chargement du fichier de progrès')
    }
  }

  private async saveProgress() {
    try {
      fs.writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2))
    } catch (error) {
      console.error('⚠️  Erreur lors de la sauvegarde du progrès:', error)
    }
  }

  private async geocodePartners() {
    console.log('🤝 Géolocalisation des partenaires restants...')
    
    let processed = this.progress.processedPartners
    
    while (processed < this.progress.totalPartners) {
      // Construire la requête avec reprise exacte
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
        
        console.log(`📍 [${processed + 1}/${this.progress.totalPartners}] Géolocalisation: ${partner.companyName} (${partner.id})`)
        
        const result = await this.geocodeAddress(
          partner.billingStreet,
          partner.billingCity,
          partner.billingPostalCode,
          partner.billingCountry
        )
        
        if (result.success) {
          try {
            await prisma.partner.update({
              where: { id: partner.id },
              data: {
                latitude: result.latitude,
                longitude: result.longitude
              }
            })
            
            this.progress.successfulGeocoding++
            console.log(`  ✅ Coordonnées: ${result.latitude}, ${result.longitude}`)
          } catch (updateError) {
            console.log(`  ⚠️  Coordonnées trouvées mais erreur de mise à jour: ${updateError}`)
            this.progress.failedGeocoding++
          }
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
  const resumeFromId = process.argv[2] // Premier argument = ID de reprise
  
  const geocoder = new ExactResumeGeocoder(5, 1000) // 5 par batch, 1 seconde entre les requêtes
  
  geocoder.geocodeAllPartners(resumeFromId)
    .then(() => {
      console.log('🎉 Géolocalisation des partenaires terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { ExactResumeGeocoder }
import { PrismaClient, ServiceType, VenueType } from '@prisma/client'
import * as argon2 from 'argon2'
import fs from 'fs'
import path from 'path'

// Fonction pour géocoder une adresse en coordonnées
async function geocodeAddress(address: string) {
  try {
    // Nettoyer l'adresse
    const cleanAddress = address.trim()
    if (!cleanAddress) {
      throw new Error('Adresse vide')
    }

    // Essayer plusieurs variantes de l'adresse
    const searchVariants = [
      cleanAddress,
      cleanAddress + ', France',
      cleanAddress + ', Paris, France',
      cleanAddress.replace(/\d+/, '') + ', France', // Sans numéro
      cleanAddress.split(' ').slice(0, 3).join(' ') + ', France' // Premiers mots
    ]

    let data = null
    let usedVariant = ''

    // Essayer chaque variante
    for (const variant of searchVariants) {
      try {
        // Essayer d'abord avec la recherche française
        let response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(variant)}&limit=5&countrycodes=fr&addressdetails=1`
        )
        
        if (!response.ok) {
          continue
        }
        
        data = await response.json()
        
        // Si pas de résultat en France, essayer sans restriction de pays
        if (!data || data.length === 0) {
          response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(variant)}&limit=5&addressdetails=1`
          )
          
          if (!response.ok) {
            continue
          }
          
          data = await response.json()
        }
        
        if (data && data.length > 0) {
          usedVariant = variant
          break
        }
      } catch (error) {
        console.error(`Erreur avec la variante "${variant}":`, error)
        continue
      }
      
      // Attendre un peu entre les requêtes pour respecter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    if (data && data.length > 0) {
      const result = data[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        usedVariant: usedVariant
      }
    } else {
      // Si aucune adresse trouvée, essayer avec une recherche plus large
      const fallbackResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress.split(' ').slice(0, 2).join(' '))}&limit=1&countrycodes=fr`
      )
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        if (fallbackData && fallbackData.length > 0) {
          const result = fallbackData[0]
          return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            displayName: result.display_name,
            usedVariant: 'recherche simplifiée'
          }
        }
      }
      
      throw new Error(`Aucune adresse trouvée pour: "${cleanAddress}". Essayez une adresse plus complète.`)
    }
  } catch (error) {
    console.error('Erreur de géocodification:', error)
    throw error
  }
}

const prisma = new PrismaClient()

// Mapping des types d'établissements vers VenueType
const venueTypeMapping: Record<string, VenueType> = {
  'Domaine mariage': VenueType.DOMAINE,
  'Château mariage': VenueType.CHATEAU,
  'Salle mariage': VenueType.SALLE_DE_RECEPTION,
  'Château': VenueType.CHATEAU,
  'Hôtel': VenueType.HOTEL,
  'Restaurant': VenueType.RESTAURANT,
  'Salle de réception': VenueType.SALLE_DE_RECEPTION,
  'Auberge': VenueType.AUBERGE,
  'Bateau': VenueType.BATEAU,
  'Plage': VenueType.PLAGE,
  'Domaine': VenueType.DOMAINE,
  'Chateau': VenueType.CHATEAU,
  'Hotel': VenueType.HOTEL,
  'Salle de reception': VenueType.SALLE_DE_RECEPTION,
}

// Configuration temporaire
const TEMP_EMAIL = 'martin@gmail.com'
const TEMP_PASSWORD = 'Test123!'
const TEMP_BILLING = {
  billingStreet: 'Adresse temporaire',
  billingCity: 'Ville temporaire',
  billingPostalCode: '00000',
  billingCountry: 'France',
  siret: '00000000000000',
  vatNumber: 'FR00000000000'
}

// Fichier de progression
const PROGRESS_FILE = path.join(__dirname, 'migration-progress.json')

interface MigrationProgress {
  lastProcessedIndex: number
  totalEstablishments: number
  processedCount: number
  errorCount: number
  errors: Array<{
    establishmentId: string
    establishmentName: string
    error: string
    timestamp: string
  }>
}

function loadProgress(): MigrationProgress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.log('⚠️  Impossible de charger le fichier de progression, démarrage depuis le début')
  }
  
  return {
    lastProcessedIndex: -1,
    totalEstablishments: 0,
    processedCount: 0,
    errorCount: 0,
    errors: []
  }
}

function saveProgress(progress: MigrationProgress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la progression:', error)
  }
}

async function migrateEstablishmentsToStorefronts() {
  try {
    console.log('🚀 Début de la migration des établissements vers les vitrines...')

    // Charger la progression existante
    const progress = loadProgress()
    
    // Récupérer tous les établissements avec leurs images
    const establishments = await prisma.establishment.findMany({
      include: {
        Images: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })
    
    progress.totalEstablishments = establishments.length
    
    console.log(`📊 ${establishments.length} établissements trouvés`)
    console.log(`🔄 Reprise depuis l'index: ${progress.lastProcessedIndex + 1}`)
    console.log(`✅ Déjà traités: ${progress.processedCount}`)
    console.log(`❌ Erreurs précédentes: ${progress.errorCount}`)

    for (let i = progress.lastProcessedIndex + 1; i < establishments.length; i++) {
      const establishment = establishments[i]
      
      try {
        console.log(`\n🔄 Traitement de l'établissement ${i + 1}/${establishments.length}: ${establishment.name}`)
        console.log(`   📍 Type: ${establishment.type}`)
        console.log(`   📍 Ville: ${establishment.city}`)
        console.log(`   📍 Région: ${establishment.region}`)
        console.log(`   📍 Capacité: ${establishment.maxCapacity}`)
        console.log(`   📍 Prix: ${establishment.startingPrice} ${establishment.currency}`)
        console.log(`   📍 Images: ${establishment.Images?.length || 0} images`)

        // Vérifier si une vitrine existe déjà pour cet établissement
        const existingStorefront = await prisma.partnerStorefront.findFirst({
          where: {
            companyName: establishment.name
          }
        })

        if (existingStorefront) {
          console.log(`⚠️  Vitrine déjà existante pour: ${establishment.name}`)
          progress.lastProcessedIndex = i
          progress.processedCount++
          saveProgress(progress)
          continue
        }

        // Créer un utilisateur temporaire avec l'ID de l'établissement comme email
        const hashedPassword = await argon2.hash(TEMP_PASSWORD)
        const user = await prisma.user.create({
          data: {
            name: establishment.name,
            email: `${establishment.id}@temp.com`,
            password: hashedPassword,
            role: 'PARTNER'
          }
        })

        // Déterminer le type de lieu
        const venueType = venueTypeMapping[establishment.type] || VenueType.UNKNOWN
        console.log(`   🏛️  Type mappé: ${establishment.type} → ${venueType}`)

        // Construire l'adresse complète
        const fullAddress = `${establishment.city}, ${establishment.region}, ${establishment.country}`
        
        // Géocoder l'adresse pour obtenir les coordonnées
        let venueLatitude = null
        let venueLongitude = null
        
        try {
          console.log(`   🗺️  Géocodification de l'adresse: ${fullAddress}`)
          const coords = await geocodeAddress(fullAddress)
          venueLatitude = coords.lat
          venueLongitude = coords.lng
          console.log(`   ✅ Coordonnées trouvées: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
          console.log(`   ⚠️  Impossible de géocoder l'adresse: ${errorMessage}`)
        }

        // Créer la vitrine
        const storefront = await prisma.partnerStorefront.create({
          data: {
            companyName: establishment.name,
            description: establishment.description,
            serviceType: ServiceType.LIEU,
            venueType: venueType,
            isActive: true,
            interventionType: 'all_france',
            interventionRadius: 50,
            venueAddress: fullAddress,
            venueLatitude: venueLatitude,
            venueLongitude: venueLongitude,
            ...TEMP_BILLING,
            userId: user.id
          }
        })

        // Créer l'espace de réception
        await prisma.receptionSpace.create({
          data: {
            name: establishment.name,
            description: establishment.description,
            surface: 100, // Valeur par défaut
            seatedCapacity: establishment.maxCapacity,
            standingCapacity: Math.round(establishment.maxCapacity * 1.2),
            hasDanceFloor: true,
            hasPmrAccess: false,
            hasPrivateOutdoor: false,
            storefrontId: storefront.id
          }
        })

        // Créer les options de réception par défaut
        await prisma.receptionOptions.create({
          data: {
            rentalDuration: '1 jour',
            price: establishment.startingPrice,
            accommodationType: 'Aucun',
            numberOfRooms: 0,
            numberOfBeds: 0,
            hasMandatoryCaterer: false,
            providesCatering: false,
            allowsOwnDrinks: true,
            hasCorkageFee: false,
            corkageFee: 0,
            hasTimeLimit: false,
            hasMandatoryPhotographer: false,
            hasMusicExclusivity: false,
            includesCleaning: true,
            allowsPets: false,
            allowsMultipleEvents: false,
            hasSecurityGuard: false,
            storefrontId: storefront.id
          }
        })

        // Migrer les images vers les médias
        if (establishment.Images && establishment.Images.length > 0) {
          for (let j = 0; j < establishment.Images.length; j++) {
            const image = establishment.Images[j]
            await prisma.media.create({
              data: {
                url: image.url,
                type: 'IMAGE',
                title: `${establishment.name} - Image ${j + 1}`,
                description: `Image de ${establishment.name}`,
                order: image.order,
                storefrontId: storefront.id
              }
            })
          }
        }

        // Ajouter l'image principale si elle existe
        if (establishment.imageUrl && establishment.imageUrl !== '/placeholder-venue.jpg') {
          await prisma.media.create({
            data: {
              url: establishment.imageUrl,
              type: 'IMAGE',
              title: `${establishment.name} - Image principale`,
              description: `Image principale de ${establishment.name}`,
              order: 0,
              storefrontId: storefront.id
            }
          })
        }

        progress.lastProcessedIndex = i
        progress.processedCount++
        saveProgress(progress)
        
        console.log(`✅ Vitrine créée avec succès pour: ${establishment.name}`)

      } catch (error) {
        progress.errorCount++
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        
        progress.errors.push({
          establishmentId: establishment.id,
          establishmentName: establishment.name,
          error: errorMessage,
          timestamp: new Date().toISOString()
        })
        
        saveProgress(progress)
        
        console.error(`❌ Erreur lors du traitement de ${establishment.name}:`, error)
        
        // Continuer avec le prochain établissement au lieu d'arrêter
        console.log(`🔄 Continuation avec le prochain établissement...`)
      }
    }

    console.log(`\n🎉 Migration terminée !`)
    console.log(`✅ ${progress.processedCount} vitrines créées avec succès`)
    console.log(`❌ ${progress.errorCount} erreurs rencontrées`)
    
    if (progress.errors.length > 0) {
      console.log(`\n📋 Détail des erreurs:`)
      progress.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.establishmentName}: ${error.error}`)
      })
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
migrateEstablishmentsToStorefronts() 
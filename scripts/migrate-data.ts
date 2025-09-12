import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import { clearDatabase } from './clear-database'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

// Fichier de sauvegarde du progrès
const PROGRESS_FILE = path.join(__dirname, 'migration-progress.json')

// Fonction pour sauvegarder le progrès
function saveProgress(progress: MigrationProgress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

// Fonction pour charger le progrès
function loadProgress(): MigrationProgress | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
    }
  } catch (error) {
    console.error('Erreur lors du chargement du progrès:', error)
  }
  return null
}

// Fonction pour effacer le progrès
function clearProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE)
  }
}

// Mapping des types de fichiers vers les ServiceType
const TYPE_MAPPING: Record<string, string> = {
  'venues.json': 'LIEU',
  'photographers.json': 'PHOTOGRAPHE',
  'caterers.json': 'TRAITEUR',
  'decorators.json': 'DECORATION',
  'videographers.json': 'VIDEO',
  'music-vendors.json': 'MUSIQUE',
  'suits.json': 'DECORATION', // Changed from COSTUME
  'wedding-cakes.json': 'WEDDING_CAKE',
  'honeymoon.json': 'LUNE_DE_MIEL',
  'entertainment.json': 'ANIMATION',
  'invitations.json': 'FAIRE_PART',
  'organization.json': 'ORGANISATION',
  'gifts.json': 'CADEAUX_INVITES',
  'officiants.json': 'OFFICIANT',
  'florist-decoration.json': 'FLORISTE',
  'transport.json': 'VOITURE',
  'beauty.json': 'DECORATION', // Changed from COIFFURE
  'dresses.json': 'DECORATION', // Changed from ROBE
  'florists.json': 'FLORISTE',
  'jewelry.json': 'DECORATION', // Changed from BIJOUX
  'wine-spirits.json': 'VIN'
}

interface MigrationConfig {
  batchSize: number
  maxConcurrentUploads: number
  retryAttempts: number
  imageCompression: boolean
  clearDatabaseFirst: boolean
}

interface MigrationProgress {
  totalEntities: number
  processedEntities: number
  uploadedImages: number
  failedUploads: number
  currentStep: 'preparation' | 'creation' | 'upload' | 'update' | 'complete'
  lastProcessedFile?: string
  lastProcessedIndex?: number
}

interface RawEntity {
  url: string
  name: string
  type: string
  description: string
  images: string[]
  price: string
  address: string
  city: string
  region: string
  capacity?: string
  rating: string
  services?: string[]
}

class DataMigrator {
  private config: MigrationConfig
  private progress: MigrationProgress
  private dataDir: string

  constructor(config: MigrationConfig) {
    this.config = config
    // Charger le progrès existant ou initialiser
    const savedProgress = loadProgress()
    this.progress = savedProgress || {
      totalEntities: 0,
      processedEntities: 0,
      uploadedImages: 0,
      failedUploads: 0,
      currentStep: 'preparation'
    }
    this.dataDir = path.join(process.cwd(), 'data')
  }

  private async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MiB
      timeCost: 3, // 3 iterations
      parallelism: 1
    })
  }

  async start() {
    console.log('🚀 Début de la migration des données...')
    
    // Vérifier s'il y a un progrès à reprendre
    if (this.progress.currentStep !== 'preparation') {
      console.log('🔄 Reprise de la migration depuis:', this.progress.currentStep)
      console.log(`📊 Progrès: ${this.progress.processedEntities}/${this.progress.totalEntities} entités`)
    }
    
    if (this.config.clearDatabaseFirst && this.progress.currentStep === 'preparation') {
      console.log('🗑️  Nettoyage de la base de données...')
      await clearDatabase()
      clearProgress() // Effacer le progrès après nettoyage
    }

    try {
      if (this.progress.currentStep === 'preparation') {
        await this.prepareMigration()
      }
      
      if (this.progress.currentStep === 'creation' || this.progress.currentStep === 'preparation') {
        await this.createEntities()
      }
      
      if (this.progress.currentStep === 'upload' || this.progress.currentStep === 'creation') {
        await this.uploadImages()
      }
      
      if (this.progress.currentStep === 'update' || this.progress.currentStep === 'upload') {
        await this.updateImageUrls()
      }
      
      console.log('✅ Migration terminée avec succès !')
      this.printFinalStats()
      clearProgress() // Effacer le progrès à la fin
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async prepareMigration() {
    console.log('📋 Préparation de la migration...')
    this.progress.currentStep = 'preparation'
    
    // Compter le nombre total d'entités
    const files = fs.readdirSync(this.dataDir).filter(file => file.endsWith('.json'))
    let totalEntities = 0
    
    for (const file of files) {
      const filePath = path.join(this.dataDir, file)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      
      if (file === 'venues.json') {
        totalEntities += data.venues?.length || 0
      } else {
        totalEntities += data.vendors?.length || 0
      }
    }
    
    this.progress.totalEntities = totalEntities
    console.log(`📊 Total d'entités à migrer: ${totalEntities}`)
  }

  private async createEntities() {
    console.log('🏗️  Création des entités dans MongoDB...')
    this.progress.currentStep = 'creation'
    
    const files = fs.readdirSync(this.dataDir).filter(file => file.endsWith('.json'))
    
    for (const file of files) {
      console.log(`📁 Traitement du fichier: ${file}`)
      await this.processFile(file)
    }
  }

  private async processFile(filename: string) {
    const filePath = path.join(this.dataDir, filename)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const serviceType = TYPE_MAPPING[filename]
    
    if (!serviceType) {
      console.warn(`⚠️  Type non mappé pour le fichier: ${filename}`)
      return
    }

    const entities = filename === 'venues.json' ? data.venues : data.vendors
    
    // Vérifier si on doit reprendre ce fichier
    let startIndex = 0
    if (this.progress.lastProcessedFile === filename && this.progress.lastProcessedIndex !== undefined) {
      startIndex = this.progress.lastProcessedIndex + 1
      console.log(`🔄 Reprise du fichier ${filename} à l'index ${startIndex}`)
    }
    
    for (let i = startIndex; i < entities.length; i++) {
      const entity = entities[i]
      try {
        if (serviceType === 'LIEU') {
          await this.createEstablishment(entity)
        } else {
          await this.createPartner(entity, serviceType)
        }
        
        // Sauvegarder le progrès
        this.progress.lastProcessedFile = filename
        this.progress.lastProcessedIndex = i
        this.progress.processedEntities++
        saveProgress(this.progress)
        
        console.log(`✅ Entité créée: ${entity.name} (${this.progress.processedEntities}/${this.progress.totalEntities})`)
        
      } catch (error) {
        console.error(`❌ Erreur lors de la création de l'entité ${entity.name}:`, error)
        // Sauvegarder le progrès même en cas d'erreur pour pouvoir reprendre
        this.progress.lastProcessedFile = filename
        this.progress.lastProcessedIndex = i
        saveProgress(this.progress)
      }
    }
  }

  private async createEstablishment(entity: RawEntity) {
    const { name, description, address, city, region, capacity, rating, images, price } = entity
    
    // Extraction des capacités
    const capacityMatch = capacity?.match(/(\d+)\s*-\s*(\d+)/)
    const minCapacity = capacityMatch ? parseInt(capacityMatch[1]) : 0
    const maxCapacity = capacityMatch ? parseInt(capacityMatch[2]) : 0
    
    // Extraction du prix
    const priceMatch = price?.match(/À partir de ([\d.,]+)€/)
    const startingPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0
    
    // Extraction du rating
    const ratingMatch = rating?.match(/(\d+\.?\d*)/)
    const ratingValue = ratingMatch ? parseFloat(ratingMatch[1]) : 0
    
    // 2. Créer l'établissement
    const establishment = await prisma.establishment.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        type: 'Domaine mariage',
        address: address.replace('· ', '').trim(),
        city: city.replace('· ', '').trim(),
        region: region.trim(),
        country: 'France',
        postalCode: '', // À extraire si possible
        maxCapacity,
        minCapacity,
        startingPrice,
        currency: 'EUR',
        rating: ratingValue,
        reviewCount: 0,
        imageUrl: images[0] || null,
        images: images,
        venueType: 'DOMAINE',
        hasParking: false,
        hasGarden: false,
        hasTerrace: false,
        hasKitchen: false,
        hasAccommodation: false
      }
    })
    
    // 1. Créer l'utilisateur pour le lieu avec l'ID de l'établissement
    const hashedPassword = await this.hashPassword('Test123456!')
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: `${establishment.id}@monmariage.ai`,
        password: hashedPassword,
        role: 'PARTNER'
      }
    })
    
    // 3. Créer la vitrine pour l'établissement
    const storefront = await prisma.partnerStorefront.create({
      data: {
        type: 'VENUE',
        isActive: true,
        logo: images[0] || null,
        images: images,
        establishmentId: establishment.id
      }
    })
    
    console.log(`  ✅ User créé: ${user.name} (${user.id})`)
    console.log(`  ✅ Establishment créé: ${establishment.name} (${establishment.id})`)
    console.log(`  ✅ Storefront créé: ${storefront.id}`)
    
    return { user, establishment, storefront }
  }

  private async createPartner(entity: RawEntity, serviceType: string) {
    const { name, description, address, city, region, images, price, services } = entity
    
    // Extraction du prix
    const priceMatch = price?.match(/À partir de ([\d.,]+)€/)
    const basePrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null
    
    // 1. Créer l'utilisateur pour le partenaire d'abord
    const hashedPassword = await this.hashPassword('Test123456!')
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: `partner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@monmariage.ai`,
        password: hashedPassword,
        role: 'PARTNER'
      }
    })
    
    // 2. Créer le partenaire avec l'ID de l'utilisateur
    const partner = await prisma.partner.create({
      data: {
        companyName: name.trim(),
        description: description.trim(),
        serviceType: serviceType as any,
        billingStreet: address.replace('· ', '').trim(),
        billingCity: city.replace('· ', '').trim(),
        billingPostalCode: '', // À extraire si possible
        billingCountry: 'France',
        siret: '00000000000000', // Temporaire
        vatNumber: 'FR00000000000', // Temporaire
        interventionType: 'all_france',
        interventionRadius: 50,
        interventionCities: [],
        basePrice,
        services: services || [],
        userId: user.id
      }
    })
    
    // 3. Mettre à jour l'email de l'utilisateur avec l'ID du partenaire
    await prisma.user.update({
      where: { id: user.id },
      data: { email: `${partner.id}@monmariage.ai` }
    })
    
    // 3. Créer la vitrine pour le partenaire
    const storefront = await prisma.partnerStorefront.create({
      data: {
        type: 'PARTNER',
        isActive: true,
        logo: images[0] || null,
        images: images,
        partnerId: partner.id
      }
    })
    
    console.log(`  ✅ User créé: ${user.name} (${user.id})`)
    console.log(`  ✅ Partner créé: ${partner.companyName} (${partner.id})`)
    console.log(`  ✅ Storefront créé: ${storefront.id}`)
    
    return { user, partner, storefront }
  }

  private async uploadImages() {
    console.log('📤 Upload des images vers Vercel Blob...')
    this.progress.currentStep = 'upload'
    
    // Cette partie sera implémentée dans le prochain script
    console.log('⏳ Upload des images - À implémenter')
  }

  private async updateImageUrls() {
    console.log('🔄 Mise à jour des URLs d\'images...')
    this.progress.currentStep = 'update'
    
    // Cette partie sera implémentée après l'upload
    console.log('⏳ Mise à jour des URLs - À implémenter')
  }



  private printFinalStats() {
    console.log('\n📊 Statistiques finales:')
    console.log(`📈 Entités traitées: ${this.progress.processedEntities}/${this.progress.totalEntities}`)
    console.log(`📤 Images uploadées: ${this.progress.uploadedImages}`)
    console.log(`❌ Échecs d'upload: ${this.progress.failedUploads}`)
  }
}

// Configuration par défaut
const defaultConfig: MigrationConfig = {
  batchSize: 10,
  maxConcurrentUploads: 5,
  retryAttempts: 3,
  imageCompression: true,
  clearDatabaseFirst: false // Ne pas vider la base par défaut pour permettre la reprise
}

// Exécution du script
if (require.main === module) {
  const migrator = new DataMigrator(defaultConfig)
  
  migrator.start()
    .then(() => {
      console.log('🎉 Migration terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { DataMigrator, TYPE_MAPPING }

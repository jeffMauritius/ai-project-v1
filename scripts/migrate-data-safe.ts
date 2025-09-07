import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

// Mapping des types de fichiers vers les ServiceType
const TYPE_MAPPING: Record<string, string> = {
  'venues.json': 'LIEU',
  'photographers.json': 'PHOTOGRAPHE',
  'caterers.json': 'TRAITEUR',
  'decorators.json': 'DECORATION',
  'videographers.json': 'VIDEO',
  'music-vendors.json': 'MUSIQUE',
  'suits.json': 'DECORATION',
  'wedding-cakes.json': 'WEDDING_CAKE',
  'honeymoon.json': 'LUNE_DE_MIEL',
  'entertainment.json': 'ANIMATION',
  'invitations.json': 'FAIRE_PART',
  'organization.json': 'ORGANISATION',
  'gifts.json': 'CADEAUX_INVITES',
  'officiants.json': 'OFFICIANT',
  'florist-decoration.json': 'FLORISTE',
  'transport.json': 'VOITURE',
  'beauty.json': 'DECORATION',
  'dresses.json': 'DECORATION',
  'florists.json': 'FLORISTE',
  'jewelry.json': 'DECORATION',
  'wine-spirits.json': 'VIN'
}

interface MigrationConfig {
  batchSize: number
  maxConcurrentUploads: number
  retryAttempts: number
  imageCompression: boolean
  preserveExistingData: boolean
}

interface MigrationProgress {
  totalEntities: number
  processedEntities: number
  skippedEntities: number
  uploadedImages: number
  failedUploads: number
  currentStep: 'preparation' | 'creation' | 'upload' | 'update' | 'complete'
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

interface ExistingData {
  establishments: Set<string>
  partners: Set<string>
  users: Set<string>
}

class SafeDataMigrator {
  private config: MigrationConfig
  private progress: MigrationProgress
  private dataDir: string
  private existingData: ExistingData

  constructor(config: MigrationConfig) {
    this.config = config
    this.progress = {
      totalEntities: 0,
      processedEntities: 0,
      skippedEntities: 0,
      uploadedImages: 0,
      failedUploads: 0,
      currentStep: 'preparation'
    }
    this.dataDir = path.join(process.cwd(), 'data')
    this.existingData = {
      establishments: new Set(),
      partners: new Set(),
      users: new Set()
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    })
  }

  async start() {
    console.log('🚀 Début de la migration sécurisée des données...')
    console.log('🔒 Mode préservation des données activé')
    
    try {
      await this.checkExistingData()
      await this.prepareMigration()
      await this.createEntities()
      await this.uploadImages()
      
      console.log('✅ Migration terminée avec succès !')
      this.printFinalStats()
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async checkExistingData() {
    console.log('🔍 Vérification des données existantes...')
    
    // Vérifier les établissements existants
    const establishments = await prisma.establishment.findMany({
      select: { name: true, city: true }
    })
    
    for (const est of establishments) {
      const key = this.generateEstablishmentKey(est.name, est.city)
      this.existingData.establishments.add(key)
    }
    
    // Vérifier les partenaires existants
    const partners = await prisma.partner.findMany({
      select: { companyName: true, serviceType: true }
    })
    
    for (const partner of partners) {
      const key = this.generatePartnerKey(partner.companyName, partner.serviceType)
      this.existingData.partners.add(key)
    }
    
    // Vérifier les utilisateurs existants
    const users = await prisma.user.findMany({
      select: { email: true }
    })
    
    for (const user of users) {
      this.existingData.users.add(user.email)
    }
    
    console.log(`📊 Données existantes détectées:`)
    console.log(`  - Établissements: ${this.existingData.establishments.size}`)
    console.log(`  - Partenaires: ${this.existingData.partners.size}`)
    console.log(`  - Utilisateurs: ${this.existingData.users.size}`)
  }

  private generateEstablishmentKey(name: string, city: string): string {
    return `${name.trim().toLowerCase()}_${city.trim().toLowerCase()}`
  }

  private generatePartnerKey(name: string, serviceType: string): string {
    return `${name.trim().toLowerCase()}_${serviceType}`
  }

  private async prepareMigration() {
    console.log('📋 Préparation de la migration...')
    this.progress.currentStep = 'preparation'
    
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
    
    for (const entity of entities) {
      try {
        let wasCreated = false
        
        if (serviceType === 'LIEU') {
          wasCreated = await this.createEstablishmentIfNotExists(entity)
        } else {
          wasCreated = await this.createPartnerIfNotExists(entity, serviceType)
        }
        
        if (wasCreated) {
          this.progress.processedEntities++
          console.log(`✅ Entité créée: ${entity.name} (${this.progress.processedEntities}/${this.progress.totalEntities})`)
        } else {
          this.progress.skippedEntities++
          console.log(`⏭️  Entité ignorée (existe déjà): ${entity.name} (${this.progress.skippedEntities} ignorées)`)
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de la création de l'entité ${entity.name}:`, error)
      }
    }
  }

  private async createEstablishmentIfNotExists(entity: RawEntity): Promise<boolean> {
    const { name, city } = entity
    const key = this.generateEstablishmentKey(name, city)
    
    // Vérifier si l'établissement existe déjà
    if (this.existingData.establishments.has(key)) {
      return false
    }

    const { description, address, region, capacity, rating, images, price } = entity
    
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
    
    // Créer l'établissement
    const establishment = await prisma.establishment.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        type: 'Domaine mariage',
        address: address.replace('· ', '').trim(),
        city: city.replace('· ', '').trim(),
        region: region.trim(),
        country: 'France',
        postalCode: '',
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
    
    // Créer l'utilisateur pour le lieu
    const email = `${establishment.id}@monmariage.ai`
    if (!this.existingData.users.has(email)) {
      const hashedPassword = await this.hashPassword('Test123456!')
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email,
          password: hashedPassword,
          role: 'PARTNER'
        }
      })
      
      this.existingData.users.add(email)
      console.log(`  ✅ User créé: ${user.name} (${user.id})`)
    }
    
    // Créer la vitrine pour l'établissement
    const storefront = await prisma.partnerStorefront.create({
      data: {
        type: 'VENUE',
        isActive: true,
        establishmentId: establishment.id
      }
    })
    
    // Ajouter à nos données existantes
    this.existingData.establishments.add(key)
    
    console.log(`  ✅ Establishment créé: ${establishment.name} (${establishment.id})`)
    console.log(`  ✅ Storefront créé: ${storefront.id}`)
    
    return true
  }

  private async createPartnerIfNotExists(entity: RawEntity, serviceType: string): Promise<boolean> {
    const { name } = entity
    const key = this.generatePartnerKey(name, serviceType)
    
    // Vérifier si le partenaire existe déjà
    if (this.existingData.partners.has(key)) {
      return false
    }

    const { description, address, city, region, images, price, services } = entity
    
    // Extraction du prix
    const priceMatch = price?.match(/À partir de ([\d.,]+)€/)
    const basePrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null
    
    // Créer l'utilisateur pour le partenaire
    const email = `partner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@monmariage.ai`
    if (!this.existingData.users.has(email)) {
      const hashedPassword = await this.hashPassword('Test123456!')
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email,
          password: hashedPassword,
          role: 'PARTNER'
        }
      })
      
      this.existingData.users.add(email)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new Error('Utilisateur non trouvé après création')
    }
    
    // Créer le partenaire
    const partner = await prisma.partner.create({
      data: {
        companyName: name.trim(),
        description: description.trim(),
        serviceType: serviceType as any,
        billingStreet: address.replace('· ', '').trim(),
        billingCity: city.replace('· ', '').trim(),
        billingPostalCode: '',
        billingCountry: 'France',
        siret: '00000000000000',
        vatNumber: 'FR00000000000',
        interventionType: 'all_france',
        interventionRadius: 50,
        interventionCities: [],
        basePrice,
        services: services || [],
        userId: user.id
      }
    })
    
    // Mettre à jour l'email de l'utilisateur avec l'ID du partenaire
    await prisma.user.update({
      where: { id: user.id },
      data: { email: `${partner.id}@monmariage.ai` }
    })
    
    // Créer la vitrine pour le partenaire
    const storefront = await prisma.partnerStorefront.create({
      data: {
        type: 'PARTNER',
        isActive: true,
        partnerId: partner.id
      }
    })
    
    // Ajouter à nos données existantes
    this.existingData.partners.add(key)
    
    console.log(`  ✅ User créé: ${user.name} (${user.id})`)
    console.log(`  ✅ Partner créé: ${partner.companyName} (${partner.id})`)
    console.log(`  ✅ Storefront créé: ${storefront.id}`)
    
    return true
  }

  private async uploadImages() {
    console.log('📤 Upload des images (si nécessaire)...')
    this.progress.currentStep = 'upload'
    
    // Pour la phase initiale, on peut implémenter l'upload d'images plus tard
    console.log('⏳ Upload des images - À implémenter si nécessaire')
  }

  private printFinalStats() {
    console.log('\n📊 Statistiques finales de la migration:')
    console.log(`📈 Nouvelles entités créées: ${this.progress.processedEntities}`)
    console.log(`⏭️  Entités ignorées (existantes): ${this.progress.skippedEntities}`)
    console.log(`📊 Total d'entités traitées: ${this.progress.processedEntities + this.progress.skippedEntities}/${this.progress.totalEntities}`)
    console.log(`📤 Images uploadées: ${this.progress.uploadedImages}`)
    console.log(`❌ Échecs d'upload: ${this.progress.failedUploads}`)
    
    if (this.progress.skippedEntities > 0) {
      console.log('\n✅ Migration réussie avec préservation des données existantes !')
    }
  }
}

// Configuration sécurisée (préservation des données activée)
const safeConfig: MigrationConfig = {
  batchSize: 10,
  maxConcurrentUploads: 5,
  retryAttempts: 3,
  imageCompression: true,
  preserveExistingData: true
}

// Exécution du script
if (require.main === module) {
  const migrator = new SafeDataMigrator(safeConfig)
  
  migrator.start()
    .then(() => {
      console.log('🎉 Migration sécurisée terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { SafeDataMigrator }






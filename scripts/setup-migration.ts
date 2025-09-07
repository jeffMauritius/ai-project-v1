import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

// Charger les variables d'environnement
config({ path: '.env.local' })
config({ path: '.env' })

interface SetupConfig {
  dataDir: string
  requiredFiles: string[]
  requiredEnvVars: string[]
}

class MigrationSetup {
  private config: SetupConfig

  constructor() {
    this.config = {
      dataDir: path.join(process.cwd(), 'data'),
      requiredFiles: [
        'venues.json',
        'photographers.json',
        'caterers.json',
        'decorators.json',
        'videographers.json',
        'music-vendors.json',
        'suits.json',
        'wedding-cakes.json',
        'honeymoon.json',
        'entertainment.json',
        'invitations.json',
        'organization.json',
        'gifts.json',
        'officiants.json',
        'florist-decoration.json',
        'transport.json',
        'beauty.json',
        'dresses.json',
        'florists.json',
        'jewelry.json',
        'wine-spirits.json'
      ],
      requiredEnvVars: [
        'DATABASE_URL',
        'BLOB_READ_WRITE_TOKEN'
      ]
    }
  }

  async checkSetup(): Promise<boolean> {
    console.log('🔍 Vérification de la configuration de migration...')
    
    const checks = [
      this.checkDataDirectory(),
      this.checkDataFiles(),
      this.checkEnvironmentVariables(),
      this.checkDependencies()
    ]
    
    const results = await Promise.all(checks)
    const allPassed = results.every(result => result)
    
    if (allPassed) {
      console.log('✅ Configuration validée avec succès !')
      return true
    } else {
      console.log('❌ Configuration incomplète. Veuillez corriger les erreurs ci-dessus.')
      return false
    }
  }

  private async checkDataDirectory(): Promise<boolean> {
    console.log('📁 Vérification du répertoire de données...')
    
    if (!fs.existsSync(this.config.dataDir)) {
      console.error(`❌ Répertoire de données introuvable: ${this.config.dataDir}`)
      return false
    }
    
    console.log(`✅ Répertoire de données trouvé: ${this.config.dataDir}`)
    return true
  }

  private async checkDataFiles(): Promise<boolean> {
    console.log('📄 Vérification des fichiers de données...')
    
    const missingFiles: string[] = []
    const existingFiles: string[] = []
    
    for (const file of this.config.requiredFiles) {
      const filePath = path.join(this.config.dataDir, file)
      if (fs.existsSync(filePath)) {
        existingFiles.push(file)
        
        // Vérifier la taille du fichier
        const stats = fs.statSync(filePath)
        const sizeInMB = stats.size / (1024 * 1024)
        console.log(`  ✅ ${file} (${sizeInMB.toFixed(2)} MB)`)
      } else {
        missingFiles.push(file)
        console.log(`  ❌ ${file} - MANQUANT`)
      }
    }
    
    if (missingFiles.length > 0) {
      console.error(`❌ ${missingFiles.length} fichiers manquants`)
      return false
    }
    
    console.log(`✅ ${existingFiles.length} fichiers de données trouvés`)
    return true
  }

  private async checkEnvironmentVariables(): Promise<boolean> {
    console.log('🔐 Vérification des variables d\'environnement...')
    
    const missingVars: string[] = []
    const existingVars: string[] = []
    
    for (const envVar of this.config.requiredEnvVars) {
      if (process.env[envVar]) {
        existingVars.push(envVar)
        console.log(`  ✅ ${envVar} - Configuré`)
      } else {
        missingVars.push(envVar)
        console.log(`  ❌ ${envVar} - MANQUANT`)
      }
    }
    
    if (missingVars.length > 0) {
      console.error(`❌ ${missingVars.length} variables d'environnement manquantes`)
      console.log('\n📝 Veuillez ajouter les variables suivantes à votre fichier .env.local:')
      missingVars.forEach(varName => {
        console.log(`   ${varName}=your_value_here`)
      })
      return false
    }
    
    console.log(`✅ ${existingVars.length} variables d'environnement configurées`)
    return true
  }

  private async checkDependencies(): Promise<boolean> {
    console.log('📦 Vérification des dépendances...')
    
    const requiredDeps = [
      '@prisma/client',
      '@vercel/blob',
      'fs',
      'path',
      'https',
      'http'
    ]
    
    const missingDeps: string[] = []
    const existingDeps: string[] = []
    
    for (const dep of requiredDeps) {
      try {
        require.resolve(dep)
        existingDeps.push(dep)
        console.log(`  ✅ ${dep} - Installé`)
      } catch {
        missingDeps.push(dep)
        console.log(`  ❌ ${dep} - MANQUANT`)
      }
    }
    
    if (missingDeps.length > 0) {
      console.error(`❌ ${missingDeps.length} dépendances manquantes`)
      console.log('\n📝 Veuillez installer les dépendances manquantes:')
      console.log('   npm install @vercel/blob')
      return false
    }
    
    console.log(`✅ ${existingDeps.length} dépendances vérifiées`)
    return true
  }

  async generateMigrationPlan(): Promise<void> {
    console.log('\n📋 Plan de migration généré:')
    console.log('1. 🗑️  Nettoyer la base de données (clear-database.ts)')
    console.log('2. 🏗️  Créer les entités dans MongoDB (migrate-data.ts)')
    console.log('3. 📤 Uploader les images vers Vercel Blob (upload-images.ts)')
    console.log('4. 🔄 Mettre à jour les URLs d\'images')
    console.log('5. 🏪 Créer les vitrines partenaires')
    
    console.log('\n🚀 Commandes à exécuter:')
    console.log('   npm run ts-node scripts/clear-database.ts')
    console.log('   npm run ts-node scripts/migrate-data.ts')
    console.log('   npm run ts-node scripts/upload-images.ts')
  }

  async estimateMigrationTime(): Promise<void> {
    console.log('\n⏱️  Estimation du temps de migration:')
    
    // Compter le nombre total d'entités et d'images
    let totalEntities = 0
    let totalImages = 0
    
    for (const file of this.config.requiredFiles) {
      const filePath = path.join(this.config.dataDir, file)
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        
        if (file === 'venues.json') {
          const entities = data.venues || []
          totalEntities += entities.length
          entities.forEach((entity: any) => {
            totalImages += entity.images?.length || 0
          })
        } else {
          const entities = data.vendors || []
          totalEntities += entities.length
          entities.forEach((entity: any) => {
            totalImages += entity.images?.length || 0
          })
        }
      }
    }
    
    // Estimation du temps
    const entityTime = totalEntities * 0.1 // 0.1s par entité
    const imageTime = totalImages * 2 // 2s par image (téléchargement + upload)
    const totalTimeSeconds = entityTime + imageTime
    const totalTimeMinutes = Math.ceil(totalTimeSeconds / 60)
    
    console.log(`📊 Statistiques estimées:`)
    console.log(`   Entités: ${totalEntities}`)
    console.log(`   Images: ${totalImages}`)
    console.log(`   Temps estimé: ${totalTimeMinutes} minutes`)
    console.log(`   Taille estimée: ${(totalImages * 0.5).toFixed(1)} MB (0.5 MB/image)`)
  }
}

// Exécution du script
if (require.main === module) {
  const setup = new MigrationSetup()
  
  setup.checkSetup()
    .then(async (isValid) => {
      if (isValid) {
        await setup.generateMigrationPlan()
        await setup.estimateMigrationTime()
        console.log('\n🎉 Prêt pour la migration !')
      } else {
        console.log('\n❌ Configuration incomplète. Veuillez corriger les erreurs.')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('💥 Erreur lors de la vérification:', error)
      process.exit(1)
    })
}

export { MigrationSetup }

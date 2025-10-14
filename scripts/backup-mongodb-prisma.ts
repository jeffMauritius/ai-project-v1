import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface BackupData {
  timestamp: string
  collections: {
    [key: string]: any[]
  }
  metadata: {
    totalRecords: number
    collections: string[]
    version: string
  }
}

async function createMongoBackup() {
  console.log('🗄️  Création du backup MongoDB via Prisma...')
  console.log('==========================================')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = './backups'
  const backupFile = `mongodb_backup_prisma_${timestamp}.json`

  // Créer le dossier de backup s'il n'existe pas
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const backupData: BackupData = {
    timestamp: new Date().toISOString(),
    collections: {},
    metadata: {
      totalRecords: 0,
      collections: [],
      version: '1.0'
    }
  }

  try {
    // Liste des collections principales à sauvegarder
    const collections = [
      'user',
      'partner', 
      'establishment',
      'storefront',
      'subscription',
      'consultedStorefront',
      'favorite',
      'searchHistory',
      'guest',
      'table',
      'weddingProvider'
    ]

    console.log(`📋 Sauvegarde de ${collections.length} collections...`)

    for (const collectionName of collections) {
      try {
        console.log(`📦 Sauvegarde de ${collectionName}...`)
        
        // Utiliser Prisma pour récupérer les données
        const data = await (prisma as any)[collectionName].findMany()
        
        backupData.collections[collectionName] = data
        backupData.metadata.totalRecords += data.length
        backupData.metadata.collections.push(collectionName)
        
        console.log(`✅ ${collectionName}: ${data.length} enregistrements`)
      } catch (error: any) {
        console.log(`⚠️  ${collectionName}: ${error.message}`)
        // Continuer même si une collection échoue
      }
    }

    // Sauvegarder le fichier JSON
    const backupPath = path.join(backupDir, backupFile)
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))

    // Créer un fichier de métadonnées
    const metadataPath = path.join(backupDir, `metadata_${timestamp}.txt`)
    const metadataContent = `
Backup créé le: ${new Date().toLocaleString()}
Méthode: Prisma Client
Collections: ${backupData.metadata.collections.join(', ')}
Total d'enregistrements: ${backupData.metadata.totalRecords}
Fichier: ${backupFile}
Taille: ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB
`

    fs.writeFileSync(metadataPath, metadataContent)

    console.log('\n🎉 Backup créé avec succès!')
    console.log('============================')
    console.log(`📁 Fichier: ${backupPath}`)
    console.log(`📄 Métadonnées: ${metadataPath}`)
    console.log(`📊 Collections: ${backupData.metadata.collections.length}`)
    console.log(`📈 Enregistrements: ${backupData.metadata.totalRecords}`)
    console.log(`💾 Taille: ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB`)

  } catch (error: any) {
    console.error('❌ Erreur lors de la création du backup:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Script de restauration
async function restoreMongoBackup(backupFile: string) {
  console.log('🔄 Restauration du backup MongoDB via Prisma...')
  console.log('==============================================')

  const backupPath = path.join('./backups', backupFile)
  
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Fichier de backup non trouvé: ${backupPath}`)
    return
  }

  try {
    const backupData: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
    
    console.log(`📋 Restauration de ${backupData.metadata.collections.length} collections...`)
    console.log(`📊 Total d'enregistrements: ${backupData.metadata.totalRecords}`)

    // Demander confirmation
    console.log('\n⚠️  ATTENTION: Cette opération va écraser les données existantes!')
    console.log('❓ Voulez-vous continuer? (oui/non)')
    
    // En mode script, on peut ajouter une confirmation automatique
    const confirmation = process.argv.includes('--confirm')
    if (!confirmation) {
      console.log('❌ Restauration annulée. Utilisez --confirm pour forcer la restauration.')
      return
    }

    for (const collectionName of backupData.metadata.collections) {
      try {
        console.log(`📦 Restauration de ${collectionName}...`)
        
        const data = backupData.collections[collectionName]
        
        // Supprimer les données existantes
        await (prisma as any)[collectionName].deleteMany()
        
        // Insérer les nouvelles données
        if (data.length > 0) {
          await (prisma as any)[collectionName].createMany({
            data: data,
            skipDuplicates: true
          })
        }
        
        console.log(`✅ ${collectionName}: ${data.length} enregistrements restaurés`)
      } catch (error: any) {
        console.error(`❌ ${collectionName}: ${error.message}`)
      }
    }

    console.log('\n🎉 Restauration terminée avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur lors de la restauration:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Point d'entrée du script
if (require.main === module) {
  const command = process.argv[2]
  const backupFile = process.argv[3]

  if (command === 'restore' && backupFile) {
    restoreMongoBackup(backupFile)
  } else if (command === 'backup') {
    createMongoBackup()
  } else {
    console.log('Usage:')
    console.log('  npm run backup-mongo          # Créer un backup')
    console.log('  npm run restore-mongo <file>  # Restaurer un backup')
    console.log('  npm run restore-mongo <file> --confirm  # Restaurer sans confirmation')
  }
}

export { createMongoBackup, restoreMongoBackup }

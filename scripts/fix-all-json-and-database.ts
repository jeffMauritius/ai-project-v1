import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface Vendor {
  url: string
  name: string
  type: string
  description: string
  images: string[]
  price: string
  address: string
  city: string
  region: string
  rating: string
  services: string[]
}

interface FileAnalysis {
  fileName: string
  totalVendors: number
  correctTypes: number
  incorrectTypes: number
  typeMappings: Record<string, number>
  urlSegments: Record<string, number>
  errors: Array<{
    name: string
    currentType: string
    urlSegment: string
    suggestedType: string
    url: string
  }>
}

// Mapping des segments d'URL vers les types corrects
const URL_TO_TYPE: Record<string, string> = {
  'decoration-mariage': 'decoration',
  'photographe-mariage': 'photographer',
  'videaste-mariage': 'videographer',
  'traiteur-mariage': 'caterer',
  'musique-mariage': 'music',
  'fleuriste-mariage': 'florist',
  'transport-mariage': 'transport',
  'gateau-mariage': 'wedding-cake',
  'invitation-mariage': 'invitation',
  'organisation-mariage': 'organization',
  'animation-mariage': 'entertainment',
  'officiant-mariage': 'officiant',
  'cadeaux-invites': 'gifts',
  'honeymoon': 'honeymoon',
  'beauty-mariage': 'beauty',
  'robe-mariage': 'dress',
  'costume-mariage': 'suit',
  'bijoux-mariage': 'jewelry',
  'vin-mariage': 'wine'
}

// Mapping des types JSON vers les ServiceType MongoDB
const JSON_TYPE_TO_SERVICE_TYPE: Record<string, string> = {
  'decoration': 'DECORATION',
  'photographer': 'PHOTOGRAPHE',
  'videographer': 'VIDEO',
  'caterer': 'TRAITEUR',
  'music': 'MUSIQUE',
  'florist': 'FLORISTE',
  'transport': 'VOITURE',
  'wedding-cake': 'WEDDING_CAKE',
  'invitation': 'FAIRE_PART',
  'organization': 'ORGANISATION',
  'entertainment': 'ANIMATION',
  'officiant': 'OFFICIANT',
  'gifts': 'CADEAUX_INVITES',
  'honeymoon': 'LUNE_DE_MIEL',
  'beauty': 'DECORATION', // Beauté → Décoration
  'dress': 'DECORATION', // Robes → Décoration
  'suit': 'DECORATION', // Costumes → Décoration
  'jewelry': 'DECORATION' // Bijoux → Décoration
}

function extractTypeFromUrl(url: string): string | null {
  if (!url) return null
  
  try {
    const urlObj = new URL(url)
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0)
    
    for (const segment of pathSegments) {
      if (URL_TO_TYPE[segment]) {
        return URL_TO_TYPE[segment]
      }
    }
    
    return null
  } catch (error) {
    console.warn(`URL invalide: ${url}`)
    return null
  }
}

function analyzeJsonFile(filePath: string): FileAnalysis {
  const fileName = path.basename(filePath)
  console.log(`🔍 Analyse de ${fileName}...`)
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(fileContent)
  const vendors: Vendor[] = data.vendors || data
  
  const analysis: FileAnalysis = {
    fileName,
    totalVendors: vendors.length,
    correctTypes: 0,
    incorrectTypes: 0,
    typeMappings: {},
    urlSegments: {},
    errors: []
  }
  
  for (const vendor of vendors) {
    const urlSegment = extractTypeFromUrl(vendor.url)
    
    if (urlSegment) {
      analysis.urlSegments[urlSegment] = (analysis.urlSegments[urlSegment] || 0) + 1
      
      if (vendor.type === urlSegment) {
        analysis.correctTypes++
      } else {
        analysis.incorrectTypes++
        analysis.errors.push({
          name: vendor.name,
          currentType: vendor.type,
          urlSegment: urlSegment,
          suggestedType: urlSegment,
          url: vendor.url
        })
      }
    }
    
    analysis.typeMappings[vendor.type] = (analysis.typeMappings[vendor.type] || 0) + 1
  }
  
  return analysis
}

function correctJsonFile(filePath: string): { correctedCount: number, addressCleanedCount: number, correctedData: any } {
  const fileName = path.basename(filePath)
  console.log(`🔧 Correction de ${fileName}...`)
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(fileContent)
  const vendors: Vendor[] = data.vendors || data
  
  let correctedCount = 0
  let addressCleanedCount = 0
  
  for (const vendor of vendors) {
    // 1. Corriger le type basé sur l'URL
    const correctType = extractTypeFromUrl(vendor.url)
    
    if (correctType && vendor.type !== correctType) {
      vendor.type = correctType
      correctedCount++
    }
    
    // 2. Nettoyer l'adresse (supprimer les : en début)
    if (vendor.address && vendor.address.startsWith(': ')) {
      vendor.address = vendor.address.substring(2) // Supprimer ": "
      addressCleanedCount++
    }
    
    // 3. Nettoyer aussi la ville si elle a le même problème
    if (vendor.city && vendor.city.startsWith(': ')) {
      vendor.city = vendor.city.substring(2) // Supprimer ": "
      addressCleanedCount++
    }
  }
  
  return {
    correctedCount,
    addressCleanedCount,
    correctedData: { vendors }
  }
}

async function updateDatabaseServiceTypes() {
  console.log('\n🗄️ MISE À JOUR DE LA BASE DE DONNÉES...')
  
  // Charger tous les fichiers JSON corrigés
  const dataDir = path.join(__dirname, '..', 'data')
  const jsonFiles = [
    'beauty.json', 'caterers.json', 'decorators.json', 'dresses.json', 'entertainment.json',
    'florist-decoration.json', 'florists.json', 'gifts.json', 'honeymoon.json', 'invitations.json',
    'jewelry.json', 'music-vendors.json', 'officiants.json', 'organization.json', 'photographers.json',
    'suits.json', 'transport.json', 'videographers.json', 'wedding-cakes.json', 'wine-spirits.json'
  ]
  
  const allJsonData: any[] = []
  
  for (const fileName of jsonFiles) {
    const filePath = path.join(dataDir, fileName)
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(fileContent)
      const vendors = data.vendors || data
      allJsonData.push(...vendors)
    }
  }
  
  console.log(`📄 ${allJsonData.length} entrées JSON chargées`)
  
  // Récupérer tous les partenaires
  const partners = await prisma.partner.findMany({
    select: {
      id: true,
      companyName: true,
      serviceType: true
    }
  })
  
  console.log(`🤝 ${partners.length} partners en base`)
  
  let updatedCount = 0
  
  for (const partner of partners) {
    // Trouver le partenaire dans les données JSON par nom
    const jsonEntry = allJsonData.find(entry => 
      entry.name && partner.companyName &&
      entry.name.toLowerCase().trim() === partner.companyName.toLowerCase().trim()
    )
    
    if (!jsonEntry) continue
    
    // Déterminer le bon serviceType
    const correctJsonType = extractTypeFromUrl(jsonEntry.url)
    if (!correctJsonType) continue
    
    const correctServiceType = JSON_TYPE_TO_SERVICE_TYPE[correctJsonType]
    if (!correctServiceType) continue
    
    // Vérifier si une mise à jour est nécessaire
    if (partner.serviceType !== correctServiceType) {
      await prisma.partner.update({
        where: { id: partner.id },
        data: { serviceType: correctServiceType as any }
      })
      
      console.log(`🔄 ${partner.companyName}: ${partner.serviceType} → ${correctServiceType}`)
      updatedCount++
    }
  }
  
  console.log(`\n✅ ${updatedCount} partenaires mis à jour en base`)
  
  // Vérification finale
  const finalCounts = await prisma.partner.groupBy({
    by: ['serviceType'],
    _count: { serviceType: true },
    orderBy: { _count: { serviceType: 'desc' } }
  })
  
  console.log('\n📊 NOUVEAUX COMPTAGES PAR SERVICETYPE:')
  finalCounts.forEach(group => {
    console.log(`  ${group.serviceType}: ${group._count.serviceType}`)
  })
}

async function fixAllJsonFilesAndDatabase() {
  console.log('🚀 CORRECTION COMPLÈTE DES FICHIERS JSON ET BASE DE DONNÉES\n')
  
  try {
    const dataDir = path.join(__dirname, '..', 'data')
    const jsonFiles = [
      'beauty.json', 'caterers.json', 'decorators.json', 'dresses.json', 'entertainment.json',
      'florist-decoration.json', 'florists.json', 'gifts.json', 'honeymoon.json', 'invitations.json',
      'jewelry.json', 'music-vendors.json', 'officiants.json', 'organization.json', 'photographers.json',
      'suits.json', 'transport.json', 'videographers.json', 'wedding-cakes.json', 'wine-spirits.json'
    ]
    
    // ÉTAPE 1: Analyser tous les fichiers
    console.log('📊 ÉTAPE 1: ANALYSE DE TOUS LES FICHIERS JSON')
    const analyses: FileAnalysis[] = []
    
    for (const fileName of jsonFiles) {
      const filePath = path.join(dataDir, fileName)
      if (fs.existsSync(filePath)) {
        const analysis = analyzeJsonFile(filePath)
        analyses.push(analysis)
      }
    }
    
    // Afficher le résumé des analyses
    console.log('\n📊 RÉSUMÉ DES ANALYSES:')
    let totalVendors = 0
    let totalErrors = 0
    
    analyses.forEach(analysis => {
      console.log(`\n📁 ${analysis.fileName}:`)
      console.log(`  📈 Total: ${analysis.totalVendors}`)
      console.log(`  ✅ Corrects: ${analysis.correctTypes}`)
      console.log(`  ❌ Erreurs: ${analysis.incorrectTypes}`)
      console.log(`  📊 Taux d'erreur: ${((analysis.incorrectTypes / analysis.totalVendors) * 100).toFixed(2)}%`)
      
      totalVendors += analysis.totalVendors
      totalErrors += analysis.incorrectTypes
    })
    
    console.log(`\n🎯 TOTAL GLOBAL:`)
    console.log(`  📈 Total vendors: ${totalVendors}`)
    console.log(`  ❌ Total erreurs: ${totalErrors}`)
    console.log(`  📊 Taux d'erreur global: ${((totalErrors / totalVendors) * 100).toFixed(2)}%`)
    
    // ÉTAPE 2: Corriger tous les fichiers
    console.log('\n🔧 ÉTAPE 2: CORRECTION DE TOUS LES FICHIERS JSON')
    let totalCorrected = 0
    let totalAddressCleaned = 0
    
    for (const fileName of jsonFiles) {
      const filePath = path.join(dataDir, fileName)
      if (fs.existsSync(filePath)) {
        const { correctedCount, addressCleanedCount, correctedData } = correctJsonFile(filePath)
        totalCorrected += correctedCount
        totalAddressCleaned += addressCleanedCount
        
        // Sauvegarder le fichier corrigé
        const correctedPath = path.join(dataDir, `${fileName.replace('.json', '')}-corrected.json`)
        fs.writeFileSync(correctedPath, JSON.stringify(correctedData, null, 2), 'utf-8')
        
        console.log(`✅ ${fileName}: ${correctedCount} types corrigés, ${addressCleanedCount} adresses nettoyées → ${correctedPath}`)
      }
    }
    
    console.log(`\n💾 ${totalCorrected} corrections de types effectuées`)
    console.log(`🧹 ${totalAddressCleaned} adresses nettoyées`)
    
    // ÉTAPE 3: Mettre à jour la base de données
    await updateDatabaseServiceTypes()
    
    console.log('\n🎉 CORRECTION COMPLÈTE TERMINÉE !')
    console.log('\n📋 ÉTAPES SUIVANTES:')
    console.log('1. Vérifier les fichiers *-corrected.json')
    console.log('2. Si corrects, remplacer les fichiers originaux')
    console.log('3. Tester la recherche pour vérifier la pertinence')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution
if (require.main === module) {
  fixAllJsonFilesAndDatabase()
    .then(() => {
      console.log('✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { fixAllJsonFilesAndDatabase }

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Mapping des fichiers JSON vers les ServiceType attendus
const JSON_TO_SERVICE_TYPE: Record<string, string> = {
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

interface JsonPartner {
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

interface DbPartner {
  id: string
  companyName: string
  serviceType: string
  description: string
  images: string[]
  basePrice: number | null
  billingCity: string
  billingStreet: string
}

interface ComparisonResult {
  jsonFile: string
  expectedServiceType: string
  jsonCount: number
  dbCount: number
  matchedCount: number
  unmatchedJson: string[]
  unmatchedDb: string[]
  serviceTypeMismatches: Array<{
    name: string
    jsonServiceType: string
    dbServiceType: string
  }>
}

async function compareJsonWithDatabase() {
  console.log('🔍 Comparaison des fichiers JSON avec la base de données MongoDB...\n')

  const dataDir = path.join(__dirname, '..', 'data')
  const results: ComparisonResult[] = []

  try {
    // 1. Analyser chaque fichier JSON
    for (const [jsonFile, expectedServiceType] of Object.entries(JSON_TO_SERVICE_TYPE)) {
      console.log(`📁 Analyse de ${jsonFile} (attendu: ${expectedServiceType})...`)
      
      const filePath = path.join(dataDir, jsonFile)
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️ Fichier non trouvé: ${jsonFile}`)
        continue
      }

      // Charger les données JSON
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      const jsonPartners: JsonPartner[] = jsonData.vendors || jsonData || []
      
      console.log(`  📊 ${jsonPartners.length} partenaires dans le JSON`)

      // Récupérer les partenaires correspondants de la DB
      const dbPartners = await prisma.partner.findMany({
        where: {
          serviceType: expectedServiceType
        },
        select: {
          id: true,
          companyName: true,
          serviceType: true,
          description: true,
          images: true,
          basePrice: true,
          billingCity: true,
          billingStreet: true
        }
      })

      console.log(`  📊 ${dbPartners.length} partenaires en DB avec serviceType: ${expectedServiceType}`)

      // Comparer les noms (normalisés)
      const normalizeName = (name: string) => 
        name.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()

      const jsonNames = new Set(jsonPartners.map(p => normalizeName(p.name)))
      const dbNames = new Set(dbPartners.map(p => normalizeName(p.companyName)))

      // Trouver les correspondances
      const matchedNames = new Set([...jsonNames].filter(name => dbNames.has(name)))
      const unmatchedJson = [...jsonNames].filter(name => !dbNames.has(name))
      const unmatchedDb = [...dbNames].filter(name => !jsonNames.has(name))

      // Identifier les erreurs de serviceType
      const serviceTypeMismatches: Array<{
        name: string
        jsonServiceType: string
        dbServiceType: string
      }> = []

      // Chercher dans la DB les partenaires qui devraient être dans ce fichier
      for (const jsonPartner of jsonPartners) {
        const normalizedName = normalizeName(jsonPartner.name)
        
        // Chercher ce partenaire dans la DB avec un mauvais serviceType
        const dbPartner = await prisma.partner.findFirst({
          where: {
            companyName: {
              contains: jsonPartner.name.substring(0, 10), // Recherche partielle
              mode: 'insensitive'
            },
            serviceType: { not: expectedServiceType }
          },
          select: {
            companyName: true,
            serviceType: true
          }
        })

        if (dbPartner) {
          serviceTypeMismatches.push({
            name: jsonPartner.name,
            jsonServiceType: expectedServiceType,
            dbServiceType: dbPartner.serviceType
          })
        }
      }

      const result: ComparisonResult = {
        jsonFile,
        expectedServiceType,
        jsonCount: jsonPartners.length,
        dbCount: dbPartners.length,
        matchedCount: matchedNames.size,
        unmatchedJson: unmatchedJson.slice(0, 10), // Limiter l'affichage
        unmatchedDb: unmatchedDb.slice(0, 10),
        serviceTypeMismatches: serviceTypeMismatches.slice(0, 10)
      }

      results.push(result)

      console.log(`  ✅ Correspondances trouvées: ${matchedNames.size}`)
      console.log(`  ❌ Non trouvés en DB: ${unmatchedJson.length}`)
      console.log(`  ❌ Non trouvés en JSON: ${unmatchedDb.length}`)
      console.log(`  🔄 Erreurs de serviceType: ${serviceTypeMismatches.length}`)
      
      if (serviceTypeMismatches.length > 0) {
        console.log(`  📋 Exemples d'erreurs:`)
        serviceTypeMismatches.slice(0, 3).forEach(mismatch => {
          console.log(`    "${mismatch.name}" -> JSON: ${mismatch.jsonServiceType}, DB: ${mismatch.dbServiceType}`)
        })
      }
      
      console.log('')
    }

    // 2. Résumé global
    console.log('📊 RÉSUMÉ GLOBAL:')
    console.log('=' * 80)
    
    let totalJsonCount = 0
    let totalDbCount = 0
    let totalMatchedCount = 0
    let totalMismatches = 0

    results.forEach(result => {
      totalJsonCount += result.jsonCount
      totalDbCount += result.dbCount
      totalMatchedCount += result.matchedCount
      totalMismatches += result.serviceTypeMismatches.length

      console.log(`📁 ${result.jsonFile}:`)
      console.log(`  JSON: ${result.jsonCount} | DB: ${result.dbCount} | Correspondances: ${result.matchedCount}`)
      console.log(`  Erreurs serviceType: ${result.serviceTypeMismatches.length}`)
      
      if (result.serviceTypeMismatches.length > 0) {
        console.log(`  🔴 Exemples:`)
        result.serviceTypeMismatches.slice(0, 2).forEach(mismatch => {
          console.log(`    "${mismatch.name}" -> ${mismatch.jsonServiceType} vs ${mismatch.dbServiceType}`)
        })
      }
      console.log('')
    })

    console.log('📈 TOTAUX:')
    console.log(`  Total JSON: ${totalJsonCount}`)
    console.log(`  Total DB: ${totalDbCount}`)
    console.log(`  Correspondances: ${totalMatchedCount}`)
    console.log(`  Erreurs serviceType: ${totalMismatches}`)
    console.log(`  Taux de correspondance: ${((totalMatchedCount / totalJsonCount) * 100).toFixed(1)}%`)

    // 3. Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    if (totalMismatches > 0) {
      console.log(`🔧 ${totalMismatches} partenaires ont un mauvais serviceType en DB`)
      console.log('   → Exécuter le script de correction des serviceType')
    }
    
    const unmatchedRatio = (totalJsonCount - totalMatchedCount) / totalJsonCount
    if (unmatchedRatio > 0.1) {
      console.log(`⚠️ ${((unmatchedRatio) * 100).toFixed(1)}% des partenaires JSON ne sont pas trouvés en DB`)
      console.log('   → Vérifier le processus d\'importation')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la comparaison:', error)
  } finally {
    await prisma.$disconnect()
  }
}

compareJsonWithDatabase()

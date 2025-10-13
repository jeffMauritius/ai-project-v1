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
  'transport.json': 'VOITURE',
  'florists.json': 'FLORISTE',
  'entertainment.json': 'ANIMATION',
  'wedding-cakes.json': 'WEDDING_CAKE',
  'invitations.json': 'FAIRE_PART',
  'organization.json': 'ORGANISATION',
  'gifts.json': 'CADEAUX_INVITES',
  'officiants.json': 'OFFICIANT',
  'honeymoon.json': 'LUNE_DE_MIEL',
  'beauty.json': 'DECORATION',
  'dresses.json': 'DECORATION',
  'jewelry.json': 'DECORATION',
  'suits.json': 'DECORATION',
  'wine-spirits.json': 'VIN'
}

async function quickAnalysis() {
  console.log('🔍 ANALYSE RAPIDE - État d\'avancement JSON vs MongoDB\n')

  try {
    const dataDir = path.join(__dirname, '..', 'data')
    let totalJsonCount = 0
    let totalDbCount = 0
    let totalMismatches = 0

    console.log('📊 COMPARAISON PAR FICHIER:')
    console.log('=' * 60)

    // Analyser seulement les fichiers principaux pour éviter la surcharge
    const mainFiles = ['photographers.json', 'transport.json', 'caterers.json', 'music-vendors.json', 'videographers.json']

    for (const jsonFile of mainFiles) {
      const expectedServiceType = JSON_TO_SERVICE_TYPE[jsonFile]
      if (!expectedServiceType) continue

      console.log(`\n📁 ${jsonFile} (attendu: ${expectedServiceType}):`)

      // Compter les entrées JSON
      const filePath = path.join(dataDir, jsonFile)
      if (!fs.existsSync(filePath)) {
        console.log('  ⚠️ Fichier non trouvé')
        continue
      }

      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      const jsonCount = jsonData.vendors?.length || jsonData?.length || 0
      totalJsonCount += jsonCount

      // Compter les entrées DB avec le bon serviceType
      const correctDbCount = await prisma.partner.count({
        where: { serviceType: expectedServiceType }
      })
      totalDbCount += correctDbCount

      // Compter les erreurs de classification
      const wrongClassifications = await prisma.partner.count({
        where: {
          OR: [
            { companyName: { contains: 'Photo', mode: 'insensitive' } },
            { companyName: { contains: 'Photographe', mode: 'insensitive' } },
            { description: { contains: 'photographe', mode: 'insensitive' } }
          ],
          serviceType: { not: expectedServiceType }
        }
      })

      totalMismatches += wrongClassifications

      console.log(`  📄 JSON: ${jsonCount}`)
      console.log(`  🗄️ DB correct: ${correctDbCount}`)
      console.log(`  ❌ Erreurs: ${wrongClassifications}`)
      console.log(`  📈 Ratio: ${correctDbCount > 0 ? ((correctDbCount / jsonCount) * 100).toFixed(1) : 0}%`)
    }

    // Statistiques globales de la DB
    console.log('\n📊 STATISTIQUES GLOBALES DB:')
    console.log('=' * 40)

    const serviceTypeCounts = await prisma.partner.groupBy({
      by: ['serviceType'],
      _count: { serviceType: true },
      orderBy: { _count: { serviceType: 'desc' } }
    })

    serviceTypeCounts.forEach(group => {
      console.log(`  ${group.serviceType}: ${group._count.serviceType}`)
    })

    // Problèmes identifiés
    console.log('\n🚨 PROBLÈMES IDENTIFIÉS:')
    console.log('=' * 30)

    // Vérifier les photographes mal classés
    const photographersAsVehicles = await prisma.partner.count({
      where: {
        serviceType: 'VOITURE',
        OR: [
          { companyName: { contains: 'Photo', mode: 'insensitive' } },
          { companyName: { contains: 'Photographe', mode: 'insensitive' } },
          { description: { contains: 'photographe', mode: 'insensitive' } }
        ]
      }
    })

    console.log(`🔴 ${photographersAsVehicles} photographes classés comme VOITURE`)

    // Vérifier les voitures mal classées
    const vehiclesAsPhotographers = await prisma.partner.count({
      where: {
        serviceType: 'PHOTOGRAPHE',
        OR: [
          { companyName: { contains: 'Voiture', mode: 'insensitive' } },
          { companyName: { contains: 'Car', mode: 'insensitive' } },
          { description: { contains: 'voiture', mode: 'insensitive' } }
        ]
      }
    })

    console.log(`🔴 ${vehiclesAsPhotographers} voitures classées comme PHOTOGRAPHE`)

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    console.log('=' * 20)
    
    if (photographersAsVehicles > 0) {
      console.log(`🔧 Corriger ${photographersAsVehicles} photographes mal classés`)
    }
    
    if (vehiclesAsPhotographers > 0) {
      console.log(`🔧 Corriger ${vehiclesAsPhotographers} voitures mal classées`)
    }

    const totalPartners = await prisma.partner.count()
    console.log(`📊 Total partenaires en DB: ${totalPartners}`)
    console.log(`📊 Total JSON analysé: ${totalJsonCount}`)

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickAnalysis()

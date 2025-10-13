import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function compareEstablishmentsWithVenuesJson() {
  console.log('🏢 COMPARAISON ESTABLISHMENTS vs venues.json\n')

  try {
    // 1. Charger le fichier venues.json
    console.log('📄 Chargement du fichier venues.json...')
    const venuesPath = path.join(__dirname, '..', 'data', 'venues.json')
    
    if (!fs.existsSync(venuesPath)) {
      console.log('❌ Fichier venues.json non trouvé')
      return
    }

    const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf8'))
    const venues = venuesData.venues || venuesData || []
    
    console.log(`📊 ${venues.length} venues dans le fichier JSON`)

    // 2. Analyser les types dans venues.json
    console.log('\n📊 Types dans venues.json:')
    const jsonTypeCounts: Record<string, number> = {}
    
    venues.forEach((venue: any) => {
      const type = venue.type || 'UNKNOWN'
      jsonTypeCounts[type] = (jsonTypeCounts[type] || 0) + 1
    })

    Object.entries(jsonTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
      })

    // 3. Analyser les types dans la base de données
    console.log('\n📊 Types dans la base de données:')
    const dbTypeCounts = await prisma.establishment.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    })

    dbTypeCounts.forEach(group => {
      console.log(`  ${group.type}: ${group._count.type}`)
    })

    // 4. Comparaison détaillée
    console.log('\n🔍 COMPARAISON DÉTAILLÉE:')
    console.log('=' * 50)

    const allTypes = new Set([
      ...Object.keys(jsonTypeCounts),
      ...dbTypeCounts.map(g => g.type)
    ])

    let totalJsonCount = 0
    let totalDbCount = 0
    let discrepancies = 0

    for (const type of allTypes) {
      const jsonCount = jsonTypeCounts[type] || 0
      const dbCount = dbTypeCounts.find(g => g.type === type)?._count.type || 0
      
      totalJsonCount += jsonCount
      totalDbCount += dbCount

      const difference = Math.abs(jsonCount - dbCount)
      const status = difference === 0 ? '✅' : difference < 10 ? '⚠️' : '❌'
      
      if (difference > 0) discrepancies++

      console.log(`${status} ${type}:`)
      console.log(`  JSON: ${jsonCount} | DB: ${dbCount} | Différence: ${difference}`)
      
      if (difference > 0) {
        if (jsonCount > dbCount) {
          console.log(`    📄 ${jsonCount - dbCount} venues en JSON mais pas en DB`)
        } else {
          console.log(`    🗄️ ${dbCount - jsonCount} venues en DB mais pas en JSON`)
        }
      }
      console.log('')
    }

    // 5. Statistiques globales
    console.log('📈 STATISTIQUES GLOBALES:')
    console.log('=' * 30)
    console.log(`📄 Total venues JSON: ${totalJsonCount}`)
    console.log(`🗄️ Total establishments DB: ${totalDbCount}`)
    console.log(`🔍 Types avec différences: ${discrepancies}`)
    console.log(`📊 Taux de correspondance: ${((Math.min(totalJsonCount, totalDbCount) / Math.max(totalJsonCount, totalDbCount)) * 100).toFixed(1)}%`)

    // 6. Exemples d'incohérences
    console.log('\n🔍 EXEMPLES D\'INCOHÉRENCES:')
    console.log('=' * 35)

    // Chercher des venues qui pourraient être mal classées
    for (const typeGroup of dbTypeCounts.slice(0, 3)) { // Top 3 types
      const type = typeGroup.type
      const samples = await prisma.establishment.findMany({
        where: { type },
        select: {
          name: true,
          type: true,
          description: true
        },
        take: 2
      })

      console.log(`\n📁 Type ${type} (${typeGroup._count.type} établissements):`)
      samples.forEach((establishment, index) => {
        console.log(`  ${index + 1}. ${establishment.name}`)
        console.log(`     Description: ${establishment.description?.substring(0, 60)}...`)
      })
    }

    // 7. Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    console.log('=' * 20)

    if (discrepancies > 0) {
      console.log(`🔧 ${discrepancies} types ont des différences entre JSON et DB`)
      console.log('   → Vérifier le processus d\'importation')
    }

    if (totalJsonCount !== totalDbCount) {
      const diff = Math.abs(totalJsonCount - totalDbCount)
      console.log(`⚠️ ${diff} établissements de différence totale`)
      console.log('   → Vérifier l\'intégrité des données')
    }

    const mostCommonType = dbTypeCounts[0]
    console.log(`📊 Type le plus courant: ${mostCommonType.type} (${mostCommonType._count.type} établissements)`)

  } catch (error) {
    console.error('❌ Erreur lors de la comparaison:', error)
  } finally {
    await prisma.$disconnect()
  }
}

compareEstablishmentsWithVenuesJson()





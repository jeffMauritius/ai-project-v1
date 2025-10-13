import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeEstablishments() {
  console.log('🏢 ANALYSE DE LA COLLECTION ESTABLISHMENT\n')

  try {
    // 1. Compter les établissements par type
    console.log('📊 Nombre d\'établissements par type:')
    const typeCounts = await prisma.establishment.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    })

    typeCounts.forEach(group => {
      console.log(`  ${group.type}: ${group._count.type}`)
    })

    // 2. Analyser les types spécifiques
    console.log('\n🔍 ANALYSE DÉTAILLÉE PAR TYPE:')
    console.log('=' * 50)

    for (const typeGroup of typeCounts) {
      const type = typeGroup.type
      const count = typeGroup._count.type
      
      console.log(`\n📁 Type: ${type} (${count} établissements)`)

      // Échantillon d'établissements pour ce type
      const samples = await prisma.establishment.findMany({
        where: { type },
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          city: true,
          region: true
        },
        take: 3
      })

      console.log('  📋 Exemples:')
      samples.forEach((establishment, index) => {
        console.log(`    ${index + 1}. ${establishment.name}`)
        console.log(`       Ville: ${establishment.city}`)
        console.log(`       Description: ${establishment.description?.substring(0, 80)}...`)
      })

      // Vérifier la cohérence du type
      if (type === 'CHATEAU') {
        const inconsistentChateaux = await prisma.establishment.count({
          where: {
            type: 'CHATEAU',
            OR: [
              { name: { contains: 'restaurant', mode: 'insensitive' } },
              { name: { contains: 'hotel', mode: 'insensitive' } },
              { name: { contains: 'salle', mode: 'insensitive' } },
              { description: { contains: 'restaurant', mode: 'insensitive' } }
            ]
          }
        })
        if (inconsistentChateaux > 0) {
          console.log(`  ⚠️ ${inconsistentChateaux} châteaux potentiellement mal classés`)
        }
      }

      if (type === 'RESTAURANT') {
        const inconsistentRestaurants = await prisma.establishment.count({
          where: {
            type: 'RESTAURANT',
            OR: [
              { name: { contains: 'château', mode: 'insensitive' } },
              { name: { contains: 'domaine', mode: 'insensitive' } },
              { description: { contains: 'château', mode: 'insensitive' } }
            ]
          }
        })
        if (inconsistentRestaurants > 0) {
          console.log(`  ⚠️ ${inconsistentRestaurants} restaurants potentiellement mal classés`)
        }
      }
    }

    // 3. Statistiques générales
    console.log('\n📈 STATISTIQUES GÉNÉRALES:')
    console.log('=' * 30)

    const totalEstablishments = await prisma.establishment.count()
    const establishmentsWithImages = await prisma.establishment.count({
      where: {
        images: { isEmpty: false }
      }
    })
    const establishmentsWithPrices = await prisma.establishment.count({
      where: {
        startingPrice: { gt: 0 }
      }
    })
    const establishmentsWithCapacity = await prisma.establishment.count({
      where: {
        maxCapacity: { gt: 0 }
      }
    })

    console.log(`📊 Total établissements: ${totalEstablishments}`)
    console.log(`🖼️ Avec images: ${establishmentsWithImages} (${((establishmentsWithImages/totalEstablishments)*100).toFixed(1)}%)`)
    console.log(`💰 Avec prix: ${establishmentsWithPrices} (${((establishmentsWithPrices/totalEstablishments)*100).toFixed(1)}%)`)
    console.log(`👥 Avec capacité: ${establishmentsWithCapacity} (${((establishmentsWithCapacity/totalEstablishments)*100).toFixed(1)}%)`)

    // 4. Vérifier les données manquantes
    console.log('\n🚨 DONNÉES MANQUANTES:')
    console.log('=' * 25)

    const withoutImages = totalEstablishments - establishmentsWithImages
    const withoutPrices = totalEstablishments - establishmentsWithPrices
    const withoutCapacity = totalEstablishments - establishmentsWithCapacity

    if (withoutImages > 0) {
      console.log(`❌ ${withoutImages} établissements sans images`)
    }
    if (withoutPrices > 0) {
      console.log(`❌ ${withoutPrices} établissements sans prix`)
    }
    if (withoutCapacity > 0) {
      console.log(`❌ ${withoutCapacity} établissements sans capacité`)
    }

    // 5. Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    console.log('=' * 20)

    const mostCommonType = typeCounts[0]
    console.log(`📊 Type le plus courant: ${mostCommonType.type} (${mostCommonType._count.type} établissements)`)

    if (withoutImages > totalEstablishments * 0.1) {
      console.log(`🔧 ${withoutImages} établissements ont besoin d'images`)
    }

    if (withoutPrices > totalEstablishments * 0.1) {
      console.log(`🔧 ${withoutPrices} établissements ont besoin de prix`)
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeEstablishments()





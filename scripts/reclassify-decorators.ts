import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mappings de reclassification basés sur les mots-clés détectés
const reclassificationRules = {
  MUSIQUE: {
    keywords: ['son', 'dj', 'musique', 'orchestre', 'groupe', 'animation musicale', 'sound', 'audio'],
    priority: 1
  },
  ANIMATION: {
    keywords: ['animation', 'coordination', 'wedding planner', 'organisation', 'coordinateur'],
    priority: 2
  },
  PHOTOGRAPHE: {
    keywords: ['photo', 'photographe', 'vidéo', 'cameraman', 'film', 'photography'],
    priority: 3
  },
  FLORISTE: {
    keywords: ['fleuriste', 'fleurs', 'bouquet', 'floral', 'florale'],
    priority: 4
  },
  TRAITEUR: {
    keywords: ['traiteur', 'catering', 'cuisine', 'chef', 'menu', 'repas', 'cooking'],
    priority: 5
  },
  VOITURE: {
    keywords: ['transport', 'voiture', 'limousine', 'chauffeur', 'véhicule'],
    priority: 6
  },
  OFFICIANT: {
    keywords: ['officiant', 'cérémonie', 'mariage civil', 'célébrant'],
    priority: 7
  },
  ORGANISATION: {
    keywords: ['organisation', 'wedding planner', 'coordination', 'planning'],
    priority: 8
  }
}

async function reclassifyDecorators() {
  console.log('🔄 Début de la reclassification des décorateurs...')
  
  try {
    // Récupérer tous les décorateurs
    const decorators = await prisma.partner.findMany({
      where: {
        serviceType: 'DECORATION'
      },
      select: {
        id: true,
        companyName: true,
        description: true,
        serviceType: true
      }
    })

    console.log(`📊 ${decorators.length} décorateurs à analyser`)

    let reclassifiedCount = 0
    let keptAsDecoration = 0
    const reclassificationStats: { [key: string]: number } = {}

    console.log('\n🔄 PROCESSUS DE RECLASSIFICATION:')
    console.log('==================================')

    for (const decorator of decorators) {
      const name = decorator.companyName?.toLowerCase() || ''
      const description = decorator.description?.toLowerCase() || ''
      const fullText = `${name} ${description}`

      // Trouver la meilleure classification
      let bestMatch: { type: string; score: number } | null = null

      for (const [serviceType, rule] of Object.entries(reclassificationRules)) {
        let score = 0
        
        for (const keyword of rule.keywords) {
          if (fullText.includes(keyword)) {
            score += rule.priority // Score basé sur la priorité
          }
        }

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { type: serviceType, score }
        }
      }

      // Reclassifier si on a trouvé une meilleure correspondance
      if (bestMatch && bestMatch.score >= 2) { // Seuil minimum de confiance
        try {
          await prisma.partner.update({
            where: { id: decorator.id },
            data: { serviceType: bestMatch.type }
          })

          reclassifiedCount++
          reclassificationStats[bestMatch.type] = (reclassificationStats[bestMatch.type] || 0) + 1

          console.log(`✅ ${decorator.companyName}`)
          console.log(`   ${decorator.serviceType} → ${bestMatch.type} (score: ${bestMatch.score})`)
          
          // Log tous les 100 pour éviter le spam
          if (reclassifiedCount % 100 === 0) {
            console.log(`📈 ${reclassifiedCount} reclassifications effectuées...`)
          }
        } catch (error) {
          console.error(`❌ Erreur lors de la reclassification de ${decorator.companyName}:`, error)
        }
      } else {
        keptAsDecoration++
      }
    }

    console.log('\n📊 RÉSULTATS DE LA RECLASSIFICATION:')
    console.log('====================================')
    console.log(`Total analysés: ${decorators.length}`)
    console.log(`✅ Reclassifiés: ${reclassifiedCount}`)
    console.log(`🏷️ Gardés comme DECORATION: ${keptAsDecoration}`)
    console.log(`📈 Taux de reclassification: ${((reclassifiedCount/decorators.length)*100).toFixed(1)}%`)

    console.log('\n📋 RÉPARTITION DES RECLASSIFICATIONS:')
    console.log('=====================================')
    Object.entries(reclassificationStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`${type}: ${count} partenaires`)
      })

    // Vérifier les nouveaux compteurs
    console.log('\n🔍 NOUVEAUX COMPTEURS PAR TYPE:')
    console.log('================================')
    
    const newCounts = await prisma.partner.groupBy({
      by: ['serviceType'],
      where: {
        serviceType: {
          not: 'LIEU'
        }
      },
      _count: {
        serviceType: true
      },
      orderBy: {
        _count: {
          serviceType: 'desc'
        }
      }
    })

    newCounts.forEach(count => {
      console.log(`${count.serviceType}: ${count._count.serviceType}`)
    })

    console.log('\n🎉 Reclassification terminée !')
    console.log('Les compteurs des badges seront mis à jour automatiquement.')

  } catch (error) {
    console.error('❌ Erreur lors de la reclassification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  reclassifyDecorators()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

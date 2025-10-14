import { PrismaClient, ServiceType } from '@prisma/client'

const prisma = new PrismaClient()

interface ReclassificationResult {
  partner: any
  suggestedType: ServiceType
  confidence: number
  reasoning: string
  shouldReclassify: boolean
}

async function reclassifyDecoratorsSmart() {
  console.log('🧠 Reclassification intelligente des décorateurs...')
  console.log('==================================================')

  try {
    const decorators = await prisma.partner.findMany({
      where: { serviceType: 'DECORATION' },
      select: { 
        id: true, 
        companyName: true, 
        description: true,
        serviceType: true
      },
      take: 50 // Commencer par un échantillon
    })

    console.log(`📊 ${decorators.length} décorateurs à analyser`)
    console.log('\n🔍 ANALYSE ET RECLASSIFICATION:')
    console.log('===============================')

    const results: ReclassificationResult[] = []
    let reclassifiedCount = 0
    let skippedCount = 0

    for (const partner of decorators) {
      const analysis = analyzePartnerContext(partner)
      const shouldReclassify = analysis.confidence >= 80 && analysis.suggestedType !== 'DECORATION'
      
      results.push({
        ...analysis,
        shouldReclassify
      })

      console.log(`\n${results.length}. ${partner.companyName}`)
      console.log(`   🎯 Type suggéré: ${analysis.suggestedType}`)
      console.log(`   📊 Confiance: ${analysis.confidence}%`)
      console.log(`   💭 Raisonnement: ${analysis.reasoning}`)
      
      if (shouldReclassify) {
        console.log(`   ✅ RECLASSIFICATION: ${partner.serviceType} → ${analysis.suggestedType}`)
        
        // Effectuer la reclassification
        try {
          await prisma.partner.update({
            where: { id: partner.id },
            data: { serviceType: analysis.suggestedType }
          })
          reclassifiedCount++
          console.log(`   💾 Mis à jour en base de données`)
        } catch (error: any) {
          console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`)
        }
      } else {
        console.log(`   ⏭️  Conservé comme ${partner.serviceType} (confiance insuffisante)`)
        skippedCount++
      }
    }

    // Statistiques finales
    console.log('\n📊 RÉSULTATS FINAUX:')
    console.log('===================')
    console.log(`Total analysés: ${results.length}`)
    console.log(`✅ Reclassifiés: ${reclassifiedCount}`)
    console.log(`⏭️  Conservés: ${skippedCount}`)
    console.log(`📈 Taux de reclassification: ${((reclassifiedCount / results.length) * 100).toFixed(1)}%`)

    const typeCounts: { [key: string]: number } = {}
    results.forEach(r => {
      if (r.shouldReclassify) {
        typeCounts[r.suggestedType] = (typeCounts[r.suggestedType] || 0) + 1
      }
    })

    if (Object.keys(typeCounts).length > 0) {
      console.log('\n🔄 TYPES DE RECLASSIFICATION:')
      console.log('============================')
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`${type}: ${count} partenaires`)
      })
    }

  } catch (error) {
    console.error('💥 Erreur lors de la reclassification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function analyzePartnerContext(partner: any): ReclassificationResult {
  const name = partner.companyName?.toLowerCase() || ''
  const description = partner.description?.toLowerCase() || ''

  // Patterns pour chaque type
  const patterns = {
    FLORISTE: {
      keywords: ['fleuriste', 'fleurs', 'floral', 'bouquet', 'boutique florale', 'artisan fleuriste'],
      context: ['composition florale', 'arrangement floral', 'création florale'],
      negative: ['décoration complète', 'location de matériel', 'organisation événement']
    },
    DECORATION: {
      keywords: ['décoration', 'décorateur', 'décoratrice', 'décor', 'ambiance', 'scénographie'],
      context: ['décoration complète', 'location de matériel', 'création d\'ambiance', 'décor sur mesure'],
      negative: ['composition florale', 'arrangement floral']
    },
    ORGANISATION: {
      keywords: ['organisation', 'coordination', 'wedding planner', 'événementiel', 'planning'],
      context: ['organisation complète', 'coordination événement', 'planning mariage', 'gestion complète'],
      negative: ['décoration uniquement', 'location matériel uniquement']
    },
    TRAITEUR: {
      keywords: ['traiteur', 'cuisine', 'gastronomie', 'repas', 'buffet', 'catering'],
      context: ['service traiteur', 'prestation culinaire', 'menu mariage'],
      negative: ['décoration uniquement', 'location uniquement']
    },
    MUSIQUE: {
      keywords: ['musique', 'dj', 'sonorisation', 'animation musicale', 'orchestre'],
      context: ['animation musicale', 'sonorisation événement', 'prestation musicale'],
      negative: ['décoration uniquement', 'location matériel']
    },
    PHOTOGRAPHE: {
      keywords: ['photographe', 'photo', 'vidéo', 'vidéaste', 'reportage'],
      context: ['reportage photo', 'prestation photo', 'séance photo'],
      negative: ['décoration uniquement', 'location uniquement']
    }
  }

  let bestMatch: ServiceType = 'DECORATION'
  let bestScore = 0
  let reasoning = ''

  for (const [type, pattern] of Object.entries(patterns)) {
    let score = 0
    let typeReasoning: string[] = []

    // Score basé sur les mots-clés dans le nom (plus important)
    pattern.keywords.forEach(keyword => {
      if (name.includes(keyword)) {
        score += 40 // Score plus élevé pour le nom
        typeReasoning.push(`Nom contient "${keyword}"`)
      }
    })

    // Score basé sur les mots-clés dans la description
    pattern.keywords.forEach(keyword => {
      const matches = (description.match(new RegExp(keyword, 'g')) || []).length
      score += matches * 15
      if (matches > 0) {
        typeReasoning.push(`Description contient "${keyword}" (${matches}x)`)
      }
    })

    // Score basé sur le contexte
    pattern.context.forEach(context => {
      if (description.includes(context)) {
        score += 25
        typeReasoning.push(`Contexte: "${context}"`)
      }
    })

    // Pénalité pour les mots négatifs
    pattern.negative.forEach(negative => {
      if (description.includes(negative)) {
        score -= 20
        typeReasoning.push(`Pénalité: "${negative}"`)
      }
    })

    if (score > bestScore) {
      bestScore = score
      bestMatch = type as ServiceType
      reasoning = typeReasoning.join(', ')
    }
  }

  // Calculer la confiance (0-100%)
  const confidence = Math.min(100, Math.max(0, bestScore))

  return {
    partner,
    suggestedType: bestMatch,
    confidence,
    reasoning,
    shouldReclassify: false // Sera calculé dans la fonction principale
  }
}

if (require.main === module) {
  reclassifyDecoratorsSmart()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

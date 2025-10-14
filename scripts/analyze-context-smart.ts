import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AnalysisResult {
  partner: any
  suggestedType: string
  confidence: number
  reasoning: string
}

async function analyzeContextSmart() {
  console.log('🧠 Analyse contextuelle intelligente des décorateurs...')

  try {
    const decorators = await prisma.partner.findMany({
      where: { serviceType: 'DECORATION' },
      select: { 
        id: true, 
        companyName: true, 
        description: true,
        serviceType: true
      },
      take: 10 // Analyser un échantillon
    })

    console.log(`📊 ${decorators.length} décorateurs à analyser`)
    console.log('\n🔍 ANALYSE CONTEXTUELLE:')
    console.log('========================')

    const results: AnalysisResult[] = []

    for (const partner of decorators) {
      const analysis = analyzePartnerContext(partner)
      results.push(analysis)
      
      console.log(`\n${results.length}. ${partner.companyName}`)
      console.log(`   🎯 Type suggéré: ${analysis.suggestedType}`)
      console.log(`   📊 Confiance: ${analysis.confidence}%`)
      console.log(`   💭 Raisonnement: ${analysis.reasoning}`)
      
      // Afficher un extrait de la description
      const cleanDesc = partner.description?.replace(/<[^>]*>/g, '').substring(0, 200) || ''
      console.log(`   📝 Description: ${cleanDesc}...`)
    }

    // Statistiques
    const typeCounts: { [key: string]: number } = {}
    results.forEach(r => {
      typeCounts[r.suggestedType] = (typeCounts[r.suggestedType] || 0) + 1
    })

    console.log('\n📊 RÉSULTATS DE L\'ANALYSE:')
    console.log('===========================')
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`${type}: ${count} partenaires`)
    })

    const highConfidence = results.filter(r => r.confidence >= 80)
    console.log(`\n✅ Haute confiance (≥80%): ${highConfidence.length}/${results.length}`)

  } catch (error) {
    console.error('💥 Erreur lors de l\'analyse:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function analyzePartnerContext(partner: any): AnalysisResult {
  const name = partner.companyName?.toLowerCase() || ''
  const description = partner.description?.toLowerCase() || ''
  const fullText = `${name} ${description}`

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
    }
  }

  let bestMatch = 'DECORATION'
  let bestScore = 0
  let reasoning = ''

  for (const [type, pattern] of Object.entries(patterns)) {
    let score = 0
    let typeReasoning: string[] = []

    // Score basé sur les mots-clés dans le nom
    pattern.keywords.forEach(keyword => {
      if (name.includes(keyword)) {
        score += 30
        typeReasoning.push(`Nom contient "${keyword}"`)
      }
    })

    // Score basé sur les mots-clés dans la description
    pattern.keywords.forEach(keyword => {
      const matches = (description.match(new RegExp(keyword, 'g')) || []).length
      score += matches * 10
      if (matches > 0) {
        typeReasoning.push(`Description contient "${keyword}" (${matches}x)`)
      }
    })

    // Score basé sur le contexte
    pattern.context.forEach(context => {
      if (description.includes(context)) {
        score += 20
        typeReasoning.push(`Contexte: "${context}"`)
      }
    })

    // Pénalité pour les mots négatifs
    pattern.negative.forEach(negative => {
      if (description.includes(negative)) {
        score -= 15
        typeReasoning.push(`Pénalité: "${negative}"`)
      }
    })

    if (score > bestScore) {
      bestScore = score
      bestMatch = type
      reasoning = typeReasoning.join(', ')
    }
  }

  // Calculer la confiance (0-100%)
  const confidence = Math.min(100, Math.max(0, bestScore))

  return {
    partner,
    suggestedType: bestMatch,
    confidence,
    reasoning
  }
}

if (require.main === module) {
  analyzeContextSmart()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

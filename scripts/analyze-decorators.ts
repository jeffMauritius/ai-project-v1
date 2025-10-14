import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeDecorators() {
  console.log('🔍 Analyse détaillée des décorateurs...')
  
  try {
    // Récupérer un échantillon de décorateurs
    const decorators = await prisma.partner.findMany({
      where: {
        serviceType: 'DECORATION'
      },
      select: {
        id: true,
        companyName: true,
        description: true,
        billingCity: true,
        billingCountry: true,
        storefronts: {
          select: {
            id: true,
            images: true
          }
        }
      },
      take: 50 // Analyser un échantillon
    })

    console.log(`📊 ${decorators.length} décorateurs analysés (échantillon sur 6414 total)`)

    let suspiciousCount = 0
    let realDecorators = 0
    let withImages = 0
    let withoutImages = 0

    console.log('\n🔍 ANALYSE DÉTAILLÉE:')
    console.log('=====================')

    const suspiciousKeywords = [
      'traiteur', 'catering', 'cuisine', 'restaurant', 'chef', 'menu', 'repas',
      'photographe', 'photo', 'vidéo', 'cameraman', 'film',
      'musique', 'dj', 'son', 'animation', 'orchestre', 'groupe',
      'fleuriste', 'fleurs', 'bouquet', 'floral',
      'transport', 'voiture', 'limousine', 'chauffeur',
      'officiant', 'cérémonie', 'mariage civil',
      'organisation', 'wedding planner', 'coordination',
      'location', 'louer', 'rental', 'mobilier'
    ]

    for (const decorator of decorators) {
      const name = decorator.companyName?.toLowerCase() || ''
      const description = decorator.description?.toLowerCase() || ''
      const fullText = `${name} ${description}`
      
      const imageCount = decorator.storefronts?.[0]?.images?.length || 0
      
      // Vérifier si c'est vraiment un décorateur
      const isSuspicious = suspiciousKeywords.some(keyword => 
        fullText.includes(keyword)
      )
      
      if (isSuspicious) {
        suspiciousCount++
        console.log(`🚨 ${decorator.companyName}`)
        console.log(`   📍 ${decorator.billingCity}, ${decorator.billingCountry}`)
        console.log(`   📝 Description: ${decorator.description?.substring(0, 100)}...`)
        console.log(`   🖼️ Images: ${imageCount}`)
        
        // Identifier le type suspect
        const detectedTypes = suspiciousKeywords.filter(keyword => 
          fullText.includes(keyword)
        )
        console.log(`   🔍 Types détectés: ${detectedTypes.join(', ')}`)
        console.log('')
      } else {
        realDecorators++
        if (imageCount > 0) withImages++
        else withoutImages++
      }
    }

    console.log('\n📊 STATISTIQUES DE L\'ÉCHANTILLON:')
    console.log('==================================')
    console.log(`Total analysés: ${decorators.length}`)
    console.log(`🚨 Suspects (probablement mal classés): ${suspiciousCount}`)
    console.log(`✅ Vrais décorateurs: ${realDecorators}`)
    console.log(`📈 Taux de suspects: ${((suspiciousCount/decorators.length)*100).toFixed(1)}%`)

    console.log('\n🖼️ IMAGES DES VRAIS DÉCORATEURS:')
    console.log('================================')
    console.log(`Avec images: ${withImages}`)
    console.log(`Sans images: ${withoutImages}`)
    console.log(`Taux avec images: ${realDecorators > 0 ? ((withImages/realDecorators)*100).toFixed(1) : 0}%`)

    // Analyser les types les plus suspects
    console.log('\n🔍 TYPES LES PLUS SUSPECTS:')
    console.log('==========================')
    
    const typeAnalysis: { [key: string]: number } = {}
    
    for (const decorator of decorators) {
      const name = decorator.companyName?.toLowerCase() || ''
      const description = decorator.description?.toLowerCase() || ''
      const fullText = `${name} ${description}`
      
      for (const keyword of suspiciousKeywords) {
        if (fullText.includes(keyword)) {
          typeAnalysis[keyword] = (typeAnalysis[keyword] || 0) + 1
        }
      }
    }

    const sortedTypes = Object.entries(typeAnalysis)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)

    sortedTypes.forEach(([type, count]) => {
      console.log(`${type}: ${count} occurrences`)
    })

    // Estimation pour le total
    const estimatedSuspiciousTotal = Math.round((suspiciousCount / decorators.length) * 6414)
    const estimatedRealDecorators = 6414 - estimatedSuspiciousTotal

    console.log('\n📈 ESTIMATION POUR LE TOTAL (6414 décorateurs):')
    console.log('==============================================')
    console.log(`🚨 Suspects estimés: ~${estimatedSuspiciousTotal}`)
    console.log(`✅ Vrais décorateurs estimés: ~${estimatedRealDecorators}`)
    console.log(`📊 Taux de suspects estimé: ${((estimatedSuspiciousTotal/6414)*100).toFixed(1)}%`)

    if (suspiciousCount > decorators.length * 0.3) {
      console.log('\n⚠️  RECOMMANDATIONS:')
      console.log('===================')
      console.log('1. Il y a probablement beaucoup de partenaires mal classés comme "DECORATION"')
      console.log('2. Il faudrait reclassifier les partenaires suspects')
      console.log('3. Les vrais décorateurs seraient probablement autour de 2000-3000')
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse des décorateurs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  analyzeDecorators()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

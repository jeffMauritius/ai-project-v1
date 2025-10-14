import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping amélioré des mots-clés avec poids
const serviceTypeKeywords = {
  'OFFICIANT': {
    keywords: ['officiant', 'cérémonie', 'mariage civil', 'mariage religieux', 'union', 'célébration'],
    weight: 1.0
  },
  'TRAITEUR': {
    keywords: ['traiteur', 'cuisine', 'repas', 'menu', 'gastronomie', 'buffet', 'cocktail', 'vin', 'champagne'],
    weight: 1.0
  },
  'PHOTOGRAPHE': {
    keywords: ['photographe', 'photo', 'photographie', 'reportage', 'cliché', 'séance'],
    weight: 1.0
  },
  'MUSIQUE': {
    keywords: ['musique', 'dj', 'musicien', 'orchestre', 'groupe', 'son', 'animation musicale', 'playlist'],
    weight: 1.0
  },
  'FLORISTE': {
    keywords: ['fleuriste', 'fleurs', 'bouquet', 'décoration florale', 'roses', 'composition florale'],
    weight: 1.0
  },
  'DECORATION': {
    keywords: ['décoration', 'décorateur', 'décoratrice', 'ambiance', 'mobilier', 'location', 'accessoires', 'atelier', 'création'],
    weight: 1.0
  },
  'VOITURE': {
    keywords: ['voiture', 'véhicule', 'location', 'transport', 'limousine', 'collection', 'ancienne'],
    weight: 1.0
  },
  'VIDEO': {
    keywords: ['vidéo', 'vidéaste', 'film', 'cinématographie', 'montage'],
    weight: 1.0
  },
  'WEDDING_CAKE': {
    keywords: ['gâteau', 'pâtisserie', 'dessert', 'cake', 'sucré'],
    weight: 1.0
  },
  'ORGANISATION': {
    keywords: ['organisation', 'planner', 'coordination', 'événementiel', 'planning', 'gestion', 'event'],
    weight: 1.0
  },
  'ANIMATION': {
    keywords: ['animation', 'distraction', 'jeux', 'activités', 'spectacle'],
    weight: 1.0
  },
  'LUNE_DE_MIEL': {
    keywords: ['voyage', 'lune de miel', 'honeymoon', 'destination', 'séjour'],
    weight: 1.0
  },
  'CADEAUX_INVITES': {
    keywords: ['cadeaux', 'souvenirs', 'invités', 'étrennes'],
    weight: 1.0
  }
}

// Mots-clés spécifiques dans les noms d'entreprise (poids plus élevé)
const nameKeywords = {
  'PHOTOGRAPHE': ['photo', 'photographe', 'cliché', 'image'],
  'MUSIQUE': ['music', 'dj', 'son', 'orchestre'],
  'FLORISTE': ['fleur', 'floral', 'rose', 'bouquet'],
  'DECORATION': ['déco', 'décoration', 'atelier', 'création'],
  'TRAITEUR': ['traiteur', 'cuisine', 'gastronomie', 'restaurant'],
  'VOITURE': ['auto', 'voiture', 'véhicule', 'location'],
  'VIDEO': ['vidéo', 'film', 'cinéma'],
  'WEDDING_CAKE': ['cake', 'gâteau', 'pâtisserie'],
  'ORGANISATION': ['event', 'événement', 'planner', 'organisation']
}

// Fonction pour analyser le contenu avec score
function analyzeContentWithScore(content: string, isCompanyName: boolean = false): { [key: string]: number } {
  if (!content) return {}
  
  const text = content.toLowerCase()
  const scores: { [key: string]: number } = {}
  
  // Analyser avec les mots-clés généraux
  for (const [serviceType, config] of Object.entries(serviceTypeKeywords)) {
    let score = 0
    for (const keyword of config.keywords) {
      const matches = (text.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      score += matches * config.weight
    }
    if (score > 0) {
      scores[serviceType] = score
    }
  }
  
  // Bonus pour les mots-clés dans le nom d'entreprise
  if (isCompanyName) {
    for (const [serviceType, keywords] of Object.entries(nameKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          scores[serviceType] = (scores[serviceType] || 0) + 2.0 // Bonus de 2 points
        }
      }
    }
  }
  
  return scores
}

// Fonction pour déterminer le type principal
function getPrimaryServiceType(scores: { [key: string]: number }): string | null {
  if (Object.keys(scores).length === 0) return null
  
  // Trier par score décroissant
  const sortedTypes = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
  
  return sortedTypes[0][0]
}

async function analyzeAndFixAllPartners() {
  console.log('🔍 Analyse et correction de TOUS les partenaires...')
  console.log('===================================================')

  try {
    // Compter le total de partenaires
    const totalPartners = await prisma.partner.count()
    console.log(`📊 Total de partenaires à analyser: ${totalPartners}`)

    // Récupérer tous les partenaires par batch
    const batchSize = 50
    let processed = 0
    let corrected = 0
    let alreadyCorrect = 0
    let errors = 0

    for (let skip = 0; skip < totalPartners; skip += batchSize) {
      console.log(`\n📦 Traitement du batch ${Math.floor(skip / batchSize) + 1}/${Math.ceil(totalPartners / batchSize)}...`)
      
      const partners = await prisma.partner.findMany({
        skip,
        take: batchSize,
        select: {
          id: true,
          companyName: true,
          description: true,
          shortDescription: true,
          serviceType: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      for (const partner of partners) {
        processed++
        
        // Analyser chaque source
        const descriptionScores = analyzeContentWithScore(partner.description)
        const shortDescriptionScores = analyzeContentWithScore(partner.shortDescription)
        const nameScores = analyzeContentWithScore(partner.companyName, true)
        
        // Combiner les scores
        const allScores: { [key: string]: number } = {}
        
        // Fusionner les scores (description complète a plus de poids)
        Object.entries(descriptionScores).forEach(([type, score]) => {
          allScores[type] = (allScores[type] || 0) + score * 1.5
        })
        
        Object.entries(shortDescriptionScores).forEach(([type, score]) => {
          allScores[type] = (allScores[type] || 0) + score * 1.0
        })
        
        Object.entries(nameScores).forEach(([type, score]) => {
          allScores[type] = (allScores[type] || 0) + score * 2.0 // Nom d'entreprise très important
        })
        
        const suggestedType = getPrimaryServiceType(allScores)
        
        // Vérifier si le type actuel correspond au type suggéré
        const isCorrect = suggestedType === partner.serviceType
        
        if (!isCorrect && suggestedType) {
          try {
            await prisma.partner.update({
              where: { id: partner.id },
              data: { serviceType: suggestedType as any }
            })
            
            console.log(`   ✅ ${partner.companyName}: ${partner.serviceType} → ${suggestedType}`)
            corrected++
          } catch (error) {
            console.log(`   ❌ Erreur pour ${partner.companyName}: ${error}`)
            errors++
          }
        } else {
          alreadyCorrect++
        }
        
        // Afficher le progrès tous les 10 partenaires
        if (processed % 10 === 0) {
          console.log(`   📈 Progrès: ${processed}/${totalPartners} (${Math.round((processed / totalPartners) * 100)}%)`)
        }
      }
    }

    console.log('\n📊 RÉSUMÉ FINAL')
    console.log('================')
    console.log(`📝 Total analysé: ${processed}`)
    console.log(`✅ Corrections appliquées: ${corrected}`)
    console.log(`⏭️  Déjà corrects: ${alreadyCorrect}`)
    console.log(`❌ Erreurs: ${errors}`)
    console.log(`📈 Taux de correction: ${Math.round((corrected / processed) * 100)}%`)

    console.log('\n🎉 Analyse et correction terminées !')

  } catch (error: any) {
    console.error('💥 Erreur lors de l\'analyse:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  analyzeAndFixAllPartners()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

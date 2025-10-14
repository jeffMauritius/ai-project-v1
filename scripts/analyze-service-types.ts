import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping des mots-clés dans les descriptions vers les types de service corrects
const serviceTypeKeywords = {
  'OFFICIANT': ['officiant', 'cérémonie', 'mariage civil', 'mariage religieux', 'union', 'célébration'],
  'TRAITEUR': ['traiteur', 'cuisine', 'repas', 'menu', 'gastronomie', 'buffet', 'cocktail', 'vin', 'champagne'],
  'PHOTOGRAPHE': ['photographe', 'photo', 'photographie', 'reportage', 'cliché', 'séance'],
  'MUSIQUE': ['musique', 'dj', 'musicien', 'orchestre', 'groupe', 'son', 'animation musicale', 'playlist'],
  'FLORISTE': ['fleuriste', 'fleurs', 'bouquet', 'décoration florale', 'roses', 'composition'],
  'DECORATION': ['décoration', 'décorateur', 'décoratrice', 'ambiance', 'mobilier', 'location', 'accessoires'],
  'VOITURE': ['voiture', 'véhicule', 'location', 'transport', 'limousine', 'collection', 'ancienne'],
  'VIDEO': ['vidéo', 'vidéaste', 'film', 'cinématographie', 'montage'],
  'WEDDING_CAKE': ['gâteau', 'pâtisserie', 'dessert', 'cake', 'sucré'],
  'ORGANISATION': ['organisation', 'planner', 'coordination', 'événementiel', 'planning', 'gestion'],
  'ANIMATION': ['animation', 'distraction', 'jeux', 'activités', 'spectacle'],
  'LUNE_DE_MIEL': ['voyage', 'lune de miel', 'honeymoon', 'destination', 'séjour'],
  'CADEAUX_INVITES': ['cadeaux', 'souvenirs', 'invités', 'étrennes']
}

// Fonction pour analyser le contenu d'une description
function analyzeDescription(description: string): string[] {
  if (!description) return []
  
  const text = description.toLowerCase()
  const detectedTypes: string[] = []
  
  for (const [serviceType, keywords] of Object.entries(serviceTypeKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        detectedTypes.push(serviceType)
        break // Une fois qu'on trouve un mot-clé pour ce type, on passe au suivant
      }
    }
  }
  
  return detectedTypes
}

// Fonction pour analyser le nom de l'entreprise
function analyzeCompanyName(companyName: string): string[] {
  if (!companyName) return []
  
  const name = companyName.toLowerCase()
  const detectedTypes: string[] = []
  
  // Mots-clés spécifiques dans les noms d'entreprise
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
  
  for (const [serviceType, keywords] of Object.entries(nameKeywords)) {
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        detectedTypes.push(serviceType)
        break
      }
    }
  }
  
  return detectedTypes
}

async function analyzeServiceTypes() {
  console.log('🔍 Analyse des types de service des 20 premiers partenaires...')
  console.log('================================================================')

  try {
    // Récupérer les 20 premiers partenaires
    const partners = await prisma.partner.findMany({
      take: 20,
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

    console.log(`📊 Analyse de ${partners.length} partenaires\n`)

    let errorsFound = 0
    let correctTypes = 0

    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i]
      console.log(`${i + 1}. ${partner.companyName}`)
      console.log(`   Type actuel: ${partner.serviceType}`)
      
      // Analyser la description complète
      const descriptionTypes = analyzeDescription(partner.description)
      
      // Analyser la description courte
      const shortDescriptionTypes = analyzeDescription(partner.shortDescription)
      
      // Analyser le nom de l'entreprise
      const nameTypes = analyzeCompanyName(partner.companyName)
      
      // Combiner tous les types détectés
      const allDetectedTypes = [...new Set([...descriptionTypes, ...shortDescriptionTypes, ...nameTypes])]
      
      console.log(`   Types détectés dans la description: ${descriptionTypes.length > 0 ? descriptionTypes.join(', ') : 'Aucun'}`)
      console.log(`   Types détectés dans le nom: ${nameTypes.length > 0 ? nameTypes.join(', ') : 'Aucun'}`)
      console.log(`   Types suggérés: ${allDetectedTypes.length > 0 ? allDetectedTypes.join(', ') : 'Aucun'}`)
      
      // Vérifier si le type actuel correspond
      const isCorrect = allDetectedTypes.includes(partner.serviceType) || allDetectedTypes.length === 0
      
      if (isCorrect) {
        console.log(`   ✅ Type correct`)
        correctTypes++
      } else {
        console.log(`   ❌ ERREUR: Type incorrect`)
        console.log(`   💡 Suggestion: ${allDetectedTypes[0] || 'ORGANISATION'}`)
        errorsFound++
      }
      
      // Afficher un extrait de la description
      const descriptionPreview = partner.description ? 
        partner.description.substring(0, 100).replace(/<[^>]*>/g, '') + '...' : 
        'Aucune description'
      console.log(`   Description: ${descriptionPreview}`)
      
      console.log('')
    }

    console.log('📈 RÉSUMÉ DE L\'ANALYSE')
    console.log('======================')
    console.log(`Total analysé: ${partners.length}`)
    console.log(`Types corrects: ${correctTypes}`)
    console.log(`Erreurs détectées: ${errorsFound}`)
    console.log(`Taux d'erreur: ${Math.round((errorsFound / partners.length) * 100)}%`)

    if (errorsFound > 0) {
      console.log('\n🔧 RECOMMANDATIONS:')
      console.log('- Vérifier manuellement les types suggérés')
      console.log('- Mettre à jour les types incorrects dans la base de données')
      console.log('- Améliorer la logique de détection si nécessaire')
    }

  } catch (error: any) {
    console.error('💥 Erreur lors de l\'analyse:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  analyzeServiceTypes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

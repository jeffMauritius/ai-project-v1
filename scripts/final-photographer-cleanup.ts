import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function finalPhotographerCleanup() {
  console.log('🧹 Nettoyage final des photographes suspects...')
  
  // Rechercher tous les photographes restants
  const photographers = await prisma.partner.findMany({
    where: { serviceType: 'PHOTOGRAPHE' },
    select: { 
      id: true, 
      companyName: true, 
      serviceType: true,
      description: true
    }
  })
  
  console.log(`📸 ${photographers.length} photographes restants`)
  
  // Mots-clés très spécifiques pour identifier les lieux/services
  const venueKeywords = [
    // Types de lieux très spécifiques
    'gîte', 'camping', 'hôtel', 'auberge', 'résidence', 'villa', 'mas', 'bastide',
    'château', 'domaine', 'manoir', 'abbaye', 'moulin', 'ferme', 'salle', 'terrasses',
    'clos', 'parc', 'jardin', 'bois', 'forêt', 'logis', 'prieuré', 'demeure', 'maison',
    'chalet', 'lodge', 'centre', 'espace', 'lieu', 'site', 'endroit', 'paradis',
    
    // Services immobiliers
    'conciergerie', 'location', 'propriétés', 'immobilier', 'agence',
    
    // Activités de lieux
    'réception', 'mariage', 'événement', 'cérémonie', 'fête', 'banquet',
    'cocktail', 'dîner', 'déjeuner', 'brunch', 'gala', 'soirée',
    
    // Adjectifs de lieux
    'grand', 'petit', 'nouveau', 'ancien', 'royal', 'impérial', 'noble', 'belle',
    'beau', 'magnifique', 'charmant', 'romantique', 'historique', 'traditionnel',
    
    // Articles et prépositions
    'le ', 'la ', 'les ', 'du ', 'de ', 'des ', 'au ', 'aux ',
    
    // Noms géographiques
    'mont', 'val', 'vallée', 'colline', 'plaine', 'mer', 'océan', 'lac', 'rivière',
    'fleuve', 'étang', 'source', 'fontaine', 'cascade', 'grotte', 'caverne',
    
    // Noms de lieux spécifiques
    'terre', 'sol', 'pierre', 'roche', 'sable', 'herbe', 'fleur', 'arbre',
    'chêne', 'pin', 'cyprès', 'olivier', 'vigne', 'lavande', 'roses'
  ]
  
  // Identifier les photographes suspects basés sur le nom ET la description
  const suspiciousPhotographers = photographers.filter(photographer => {
    const name = photographer.companyName.toLowerCase()
    const description = (photographer.description || '').toLowerCase()
    
    // Vérifier si le nom contient des mots-clés de lieux
    const hasVenueKeywordsInName = venueKeywords.some(keyword => name.includes(keyword))
    
    // Vérifier si la description contient des mots-clés de lieux
    const hasVenueKeywordsInDescription = venueKeywords.some(keyword => description.includes(keyword))
    
    // Vérifier si le nom ne contient PAS de mots-clés de photographe
    const photographerKeywords = [
      'photo', 'photographe', 'photography', 'studio', 'atelier', 'artiste',
      'créatif', 'reportage', 'mariage', 'wedding', 'portrait', 'cérémonie',
      'brun', 'martin', 'durand', 'bernard', 'petit', 'moreau', 'simon',
      'michel', 'laurent', 'thomas', 'richard', 'david', 'daniel', 'nicolas',
      'jean', 'pierre', 'paul', 'jacques', 'robert', 'alain', 'philippe'
    ]
    
    const hasPhotographerKeywords = photographerKeywords.some(keyword => name.includes(keyword))
    
    // Si ça ressemble à un lieu (nom OU description) ET que ça ne ressemble pas à un photographe
    return (hasVenueKeywordsInName || hasVenueKeywordsInDescription) && !hasPhotographerKeywords
  })
  
  console.log(`🚨 ${suspiciousPhotographers.length} photographes suspects restants`)
  
  // Afficher les premiers suspects avec leur description
  console.log('\n📋 Premiers suspects:')
  suspiciousPhotographers.slice(0, 10).forEach((p, index) => {
    console.log(`${index + 1}. ${p.companyName}`)
    console.log(`   Description: ${(p.description || '').substring(0, 100)}...`)
    console.log('')
  })
  
  // Corriger automatiquement
  console.log('\n🔧 Correction en cours...')
  
  let correctedCount = 0
  for (const photographer of suspiciousPhotographers) {
    try {
      await prisma.partner.update({
        where: { id: photographer.id },
        data: { serviceType: 'LIEU' }
      })
      correctedCount++
      
      if (correctedCount % 50 === 0) {
        console.log(`✅ ${correctedCount}/${suspiciousPhotographers.length} corrigés`)
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${photographer.companyName}:`, error)
    }
  }
  
  console.log(`\n🎉 Correction terminée: ${correctedCount} lieux supplémentaires reclassés`)
  
  // Vérifier le résultat final
  const finalPhotographers = await prisma.partner.count({
    where: { serviceType: 'PHOTOGRAPHE' }
  })
  
  const finalVenues = await prisma.partner.count({
    where: { serviceType: 'LIEU' }
  })
  
  console.log(`\n📊 Résultat final:`)
  console.log(`- Photographes: ${finalPhotographers}`)
  console.log(`- Lieux: ${finalVenues}`)
  
  // Afficher les vrais photographes restants
  console.log('\n📸 Vrais photographes restants:')
  const realPhotographers = await prisma.partner.findMany({
    where: { serviceType: 'PHOTOGRAPHE' },
    select: { companyName: true, description: true },
    take: 10
  })
  
  realPhotographers.forEach((p, index) => {
    console.log(`${index + 1}. ${p.companyName}`)
    console.log(`   Description: ${(p.description || '').substring(0, 100)}...`)
    console.log('')
  })
  
  await prisma.$disconnect()
}

finalPhotographerCleanup().catch(console.error)

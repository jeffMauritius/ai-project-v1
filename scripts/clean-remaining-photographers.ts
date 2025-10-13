import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanRemainingPhotographers() {
  console.log('🧹 Nettoyage des photographes restants...')
  
  // Rechercher tous les photographes restants
  const photographers = await prisma.partner.findMany({
    where: { serviceType: 'PHOTOGRAPHE' },
    select: { 
      id: true, 
      companyName: true, 
      serviceType: true
    }
  })
  
  console.log(`📸 ${photographers.length} photographes restants`)
  
  // Mots-clés très larges pour identifier les lieux
  const venueKeywords = [
    // Types de lieux
    'château', 'domaine', 'manoir', 'abbaye', 'moulin', 'ferme', 'salle', 'terrasses',
    'résidence', 'villa', 'mas', 'bastide', 'clos', 'parc', 'jardin', 'bois', 'forêt',
    'hôtel', 'auberge', 'logis', 'prieuré', 'demeure', 'maison', 'chalet', 'lodge',
    'gîte', 'camping', 'centre', 'espace', 'lieu', 'site', 'endroit',
    
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
    'chêne', 'pin', 'cyprès', 'olivier', 'vigne', 'lavande', 'roses',
    
    // Activités de lieux
    'reception', 'mariage', 'événement', 'cérémonie', 'fête', 'banquet',
    'cocktail', 'dîner', 'déjeuner', 'brunch', 'gala', 'soirée'
  ]
  
  // Identifier les photographes suspects
  const suspiciousPhotographers = photographers.filter(photographer => {
    const name = photographer.companyName.toLowerCase()
    
    // Vérifier si le nom contient des mots-clés de lieux
    const hasVenueKeywords = venueKeywords.some(keyword => name.includes(keyword))
    
    // Vérifier si le nom ne contient PAS de mots-clés de photographe
    const photographerKeywords = [
      'photo', 'photographe', 'photography', 'studio', 'atelier', 'artiste',
      'créatif', 'reportage', 'mariage', 'wedding', 'portrait', 'cérémonie',
      'brun', 'martin', 'durand', 'bernard', 'petit', 'moreau', 'simon',
      'michel', 'laurent', 'thomas', 'richard', 'david', 'daniel', 'nicolas'
    ]
    
    const hasPhotographerKeywords = photographerKeywords.some(keyword => name.includes(keyword))
    
    // Si ça ressemble à un lieu ET que ça ne ressemble pas à un photographe
    return hasVenueKeywords && !hasPhotographerKeywords
  })
  
  console.log(`🚨 ${suspiciousPhotographers.length} photographes suspects restants`)
  
  // Afficher les premiers suspects
  console.log('\n📋 Premiers suspects:')
  suspiciousPhotographers.slice(0, 20).forEach((p, index) => {
    console.log(`${index + 1}. ${p.companyName}`)
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
      
      if (correctedCount % 100 === 0) {
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
    select: { companyName: true },
    take: 15
  })
  
  realPhotographers.forEach((p, index) => {
    console.log(`${index + 1}. ${p.companyName}`)
  })
  
  await prisma.$disconnect()
}

cleanRemainingPhotographers().catch(console.error)

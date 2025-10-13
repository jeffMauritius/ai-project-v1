import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixVenuePhotographerMistakes() {
  console.log('🔍 Recherche des établissements mal classés comme photographes...')
  
  // Rechercher les partenaires avec serviceType PHOTOGRAPHE qui ont des noms d'établissements
  const photographers = await prisma.partner.findMany({
    where: { serviceType: 'PHOTOGRAPHE' },
    select: { 
      id: true, 
      companyName: true, 
      serviceType: true,
      options: true
    }
  })
  
  console.log(`📊 ${photographers.length} photographes trouvés`)
  
  // Identifier les noms qui ressemblent à des établissements
  const venueKeywords = [
    'château', 'domaine', 'manoir', 'abbaye', 'moulin', 'ferme', 'salle', 'terrasses',
    'résidence', 'villa', 'mas', 'bastide', 'clos', 'parc', 'jardin', 'bois', 'forêt',
    'grand', 'petit', 'nouveau', 'ancien', 'royal', 'impérial', 'noble'
  ]
  
  const suspiciousPhotographers = photographers.filter(photographer => {
    const name = photographer.companyName.toLowerCase()
    return venueKeywords.some(keyword => name.includes(keyword))
  })
  
  console.log(`🚨 ${suspiciousPhotographers.length} photographes suspects trouvés`)
  
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
  
  console.log(`\n🎉 Correction terminée: ${correctedCount} établissements reclassés comme LIEU`)
  
  // Vérifier le résultat
  const remainingPhotographers = await prisma.partner.count({
    where: { serviceType: 'PHOTOGRAPHE' }
  })
  
  const venues = await prisma.partner.count({
    where: { serviceType: 'LIEU' }
  })
  
  console.log(`\n📊 Résultat final:`)
  console.log(`- Photographes: ${remainingPhotographers}`)
  console.log(`- Lieux: ${venues}`)
  
  await prisma.$disconnect()
}

fixVenuePhotographerMistakes().catch(console.error)

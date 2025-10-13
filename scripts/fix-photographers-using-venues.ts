import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function fixPhotographersUsingVenuesJson() {
  console.log('📖 Lecture du fichier venues.json...')
  
  // Lire le fichier venues.json
  const venuesData = JSON.parse(fs.readFileSync('data/venues.json', 'utf8'))
  const venues = venuesData.venues
  
  console.log(`📊 ${venues.length} lieux trouvés dans venues.json`)
  
  // Créer un mapping des noms de lieux depuis venues.json
  const venueNames = new Set(venues.map(venue => venue.name.toLowerCase().trim()))
  
  console.log(`🗺️ ${venueNames.size} noms de lieux uniques dans venues.json`)
  
  // Rechercher tous les partenaires classés comme PHOTOGRAPHE
  const photographers = await prisma.partner.findMany({
    where: { serviceType: 'PHOTOGRAPHE' },
    select: { 
      id: true, 
      companyName: true, 
      serviceType: true
    }
  })
  
  console.log(`📸 ${photographers.length} photographes trouvés dans la base`)
  
  // Identifier les photographes qui sont en fait des lieux
  const photographersToFix = photographers.filter(photographer => {
    const name = photographer.companyName.toLowerCase().trim()
    return venueNames.has(name)
  })
  
  console.log(`🚨 ${photographersToFix.length} photographes qui sont en fait des lieux`)
  
  // Afficher les premiers à corriger
  console.log('\n📋 Premiers à corriger:')
  photographersToFix.slice(0, 20).forEach((p, index) => {
    console.log(`${index + 1}. ${p.companyName}`)
  })
  
  // Corriger automatiquement
  console.log('\n🔧 Correction en cours...')
  
  let correctedCount = 0
  for (const photographer of photographersToFix) {
    try {
      await prisma.partner.update({
        where: { id: photographer.id },
        data: { serviceType: 'LIEU' }
      })
      correctedCount++
      
      if (correctedCount % 100 === 0) {
        console.log(`✅ ${correctedCount}/${photographersToFix.length} corrigés`)
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${photographer.companyName}:`, error)
    }
  }
  
  console.log(`\n🎉 Correction terminée: ${correctedCount} lieux reclassés correctement`)
  
  // Vérifier le résultat
  const remainingPhotographers = await prisma.partner.count({
    where: { serviceType: 'PHOTOGRAPHE' }
  })
  
  const venueCount = await prisma.partner.count({
    where: { serviceType: 'LIEU' }
  })
  
  console.log(`\n📊 Résultat final:`)
  console.log(`- Photographes: ${remainingPhotographers}`)
  console.log(`- Lieux: ${venueCount}`)
  
  // Vérifier que les photographes restants sont bien des photographes
  console.log('\n🔍 Vérification des photographes restants...')
  const remainingPhotographersList = await prisma.partner.findMany({
    where: { serviceType: 'PHOTOGRAPHE' },
    select: { companyName: true },
    take: 10
  })
  
  console.log('Premiers photographes restants:')
  remainingPhotographersList.forEach((p, index) => {
    console.log(`${index + 1}. ${p.companyName}`)
  })
  
  await prisma.$disconnect()
}

fixPhotographersUsingVenuesJson().catch(console.error)

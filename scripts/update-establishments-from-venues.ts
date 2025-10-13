import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function updateEstablishmentsFromCorrectedVenues() {
  console.log('🔍 Lecture du fichier venues.json corrigé...')
  
  const venuesData = JSON.parse(fs.readFileSync('data/venues.json', 'utf8'))
  const venues = venuesData.venues
  
  console.log(`📊 ${venues.length} lieux trouvés dans venues.json`)
  
  // Compter les types
  const typeCount = {}
  venues.forEach(venue => {
    const type = venue.type || 'undefined'
    typeCount[type] = (typeCount[type] || 0) + 1
  })
  
  console.log('📊 Répartition des types dans venues.json:')
  Object.entries(typeCount)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`)
    })
  
  console.log('\n🔧 Mise à jour de la base de données...')
  
  let updatedCount = 0
  let notFoundCount = 0
  
  for (const venue of venues) {
    try {
      // Chercher l'établissement par nom
      const establishment = await prisma.establishment.findFirst({
        where: { name: venue.name }
      })
      
      if (establishment) {
        // Déterminer le serviceType basé sur le type
        let serviceType = 'LIEU' // par défaut
        
        if (venue.type === 'Traiteur mariage') {
          serviceType = 'TRAITEUR'
        } else if (venue.type?.includes('Château') || venue.type?.includes('Domaine')) {
          serviceType = 'LIEU'
        } else if (venue.type?.includes('Restaurant')) {
          serviceType = 'TRAITEUR'
        } else if (venue.type?.includes('Hôtel')) {
          serviceType = 'LIEU'
        }
        
        // Mettre à jour l'établissement
        await prisma.establishment.update({
          where: { id: establishment.id },
          data: { 
            venueType: venue.type,
            // Note: serviceType n'existe pas dans le modèle Establishment
            // On pourrait l'ajouter si nécessaire
          }
        })
        
        updatedCount++
        
        if (updatedCount % 100 === 0) {
          console.log(`✅ ${updatedCount} établissements mis à jour`)
        }
      } else {
        notFoundCount++
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${venue.name}:`, error)
    }
  }
  
  console.log(`\n🎉 Mise à jour terminée:`)
  console.log(`- ${updatedCount} établissements mis à jour`)
  console.log(`- ${notFoundCount} établissements non trouvés`)
  
  // Vérifier le résultat dans la base
  console.log('\n📊 Vérification dans la base de données...')
  const establishments = await prisma.establishment.findMany({
    select: { venueType: true },
    distinct: ['venueType']
  })
  
  console.log('Types d\'établissements dans la base:')
  for (const establishment of establishments) {
    const count = await prisma.establishment.count({
      where: { venueType: establishment.venueType }
    })
    console.log(`- ${establishment.venueType}: ${count}`)
  }
  
  await prisma.$disconnect()
}

updateEstablishmentsFromCorrectedVenues().catch(console.error)



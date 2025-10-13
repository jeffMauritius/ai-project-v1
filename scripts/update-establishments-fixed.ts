import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function updateEstablishmentsFromCorrectedVenues() {
  console.log('🔍 Lecture du fichier venues.json corrigé...')
  
  const venuesData = JSON.parse(fs.readFileSync('data/venues.json', 'utf8'))
  const venues = venuesData.venues
  
  console.log(`📊 ${venues.length} lieux trouvés dans venues.json`)
  
  // Fonction pour mapper les types de venues.json vers VenueType
  function mapVenueType(venueType: string): string {
    const type = venueType.toLowerCase()
    
    if (type.includes('traiteur')) {
      return 'RESTAURANT' // Les traiteurs sont des restaurants
    } else if (type.includes('château') || type.includes('chateau')) {
      return 'CHATEAU'
    } else if (type.includes('domaine')) {
      return 'DOMAINE'
    } else if (type.includes('hôtel') || type.includes('hotel')) {
      return 'HOTEL'
    } else if (type.includes('restaurant')) {
      return 'RESTAURANT'
    } else if (type.includes('salle')) {
      return 'SALLE_DE_RECEPTION'
    } else if (type.includes('auberge')) {
      return 'AUBERGE'
    } else if (type.includes('bateau')) {
      return 'BATEAU'
    } else if (type.includes('plage')) {
      return 'PLAGE'
    } else {
      return 'UNKNOWN'
    }
  }
  
  console.log('\n🔧 Mise à jour de la base de données...')
  
  let updatedCount = 0
  let notFoundCount = 0
  let errorCount = 0
  
  for (const venue of venues) {
    try {
      // Chercher l'établissement par nom
      const establishment = await prisma.establishment.findFirst({
        where: { name: venue.name }
      })
      
      if (establishment) {
        // Mapper le type vers VenueType
        const mappedVenueType = mapVenueType(venue.type)
        
        // Mettre à jour l'établissement
        await prisma.establishment.update({
          where: { id: establishment.id },
          data: { 
            venueType: mappedVenueType as any // Cast pour contourner le typage strict
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
      errorCount++
      console.error(`❌ Erreur pour ${venue.name}:`, error.message)
    }
  }
  
  console.log(`\n🎉 Mise à jour terminée:`)
  console.log(`- ${updatedCount} établissements mis à jour`)
  console.log(`- ${notFoundCount} établissements non trouvés`)
  console.log(`- ${errorCount} erreurs`)
  
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

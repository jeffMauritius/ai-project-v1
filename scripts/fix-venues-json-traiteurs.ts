import fs from 'fs'

async function fixVenuesJsonTraiteurs() {
  console.log('🔍 Lecture du fichier venues.json...')
  
  const venuesData = JSON.parse(fs.readFileSync('data/venues.json', 'utf8'))
  const venues = venuesData.venues
  
  console.log(`📊 ${venues.length} lieux trouvés dans venues.json`)
  
  // Identifier les traiteurs mal classés basés sur l'URL
  const traiteursMalClasses = venues.filter(venue => {
    const url = venue.url.toLowerCase()
    return url.includes('traiteur-mariage') || url.includes('catering-mariage')
  })
  
  console.log(`🚨 ${traiteursMalClasses.length} traiteurs mal classés trouvés`)
  
  // Afficher les premiers exemples
  console.log('\n📋 Premiers exemples:')
  traiteursMalClasses.slice(0, 10).forEach((venue, index) => {
    console.log(`${index + 1}. ${venue.name}`)
    console.log(`   URL: ${venue.url}`)
    console.log(`   Type actuel: ${venue.type}`)
    console.log(`   Description: ${(venue.description || '').substring(0, 100)}...`)
    console.log('')
  })
  
  // Corriger les types
  console.log('\n🔧 Correction en cours...')
  
  let correctedCount = 0
  const correctedVenues = venues.map(venue => {
    const url = venue.url.toLowerCase()
    
    if (url.includes('traiteur-mariage') || url.includes('catering-mariage')) {
      correctedCount++
      return {
        ...venue,
        type: 'Traiteur mariage'
      }
    }
    
    return venue
  })
  
  console.log(`✅ ${correctedCount} traiteurs corrigés`)
  
  // Créer le fichier corrigé
  const correctedData = {
    venues: correctedVenues
  }
  
  // Sauvegarder le fichier corrigé
  fs.writeFileSync('data/venues-corrected.json', JSON.stringify(correctedData, null, 2))
  console.log('💾 Fichier venues-corrected.json créé')
  
  // Vérifier le résultat
  const typeCount = {}
  correctedVenues.forEach(venue => {
    const type = venue.type || 'undefined'
    typeCount[type] = (typeCount[type] || 0) + 1
  })
  
  console.log('\n📊 Nouvelle répartition des types:')
  Object.entries(typeCount)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`)
    })
  
  console.log('\n❓ Voulez-vous remplacer le fichier original par la version corrigée ? (y/n)')
}

fixVenuesJsonTraiteurs().catch(console.error)

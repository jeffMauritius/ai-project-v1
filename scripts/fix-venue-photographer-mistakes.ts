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
  
  // Afficher les premiers suspects
  console.log('\n📋 Premiers suspects:')
  suspiciousPhotographers.slice(0, 20).forEach((p, index) => {
    console.log(`${index + 1}. ${p.companyName}`)
  })
  
  // Vérifier s'ils ont des options de photographe
  console.log('\n🔍 Vérification des options des premiers suspects...')
  for (const photographer of suspiciousPhotographers.slice(0, 5)) {
    console.log(`\n📸 ${photographer.companyName}:`)
    if (photographer.options && typeof photographer.options === 'object') {
      const options = photographer.options as Record<string, any>
      Object.keys(options).forEach(key => {
        const value = options[key]
        if (value && typeof value === 'object' && Object.keys(value).length > 0) {
          console.log(`  - ${key}: ${Object.keys(value).length} options`)
        }
      })
    } else {
      console.log('  - Aucune option trouvée')
    }
  }
  
  // Demander confirmation avant correction
  console.log('\n❓ Voulez-vous corriger ces erreurs ? (y/n)')
  console.log('Ces partenaires seront reclassés comme LIEU au lieu de PHOTOGRAPHE')
  
  await prisma.$disconnect()
}

fixVenuePhotographerMistakes().catch(console.error)

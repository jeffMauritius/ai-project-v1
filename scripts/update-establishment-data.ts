import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface VenueData {
  name: string
  price: string
  capacity: string
}

async function updateEstablishmentData() {
  console.log('🔧 Mise à jour des données des établissements...')
  
  try {
    // Charger les données originales
    const venuesPath = path.join(process.cwd(), 'data', 'venues.json')
    const venuesData = JSON.parse(fs.readFileSync(venuesPath, 'utf-8'))
    
    console.log(`📊 ${venuesData.venues.length} établissements trouvés dans le fichier JSON`)
    
    let updatedCount = 0
    let notFoundCount = 0
    let errorCount = 0
    
    for (const venue of venuesData.venues) {
      try {
        // Chercher l'établissement dans la base de données par nom
        const establishment = await prisma.establishment.findFirst({
          where: {
            name: {
              contains: venue.name,
              mode: 'insensitive'
            }
          }
        })
        
        if (!establishment) {
          console.log(`❌ Établissement non trouvé: ${venue.name}`)
          notFoundCount++
          continue
        }
        
        // Extraire le prix correct
        let startingPrice = establishment.startingPrice
        if (venue.price) {
          const priceMatch = venue.price.match(/À partir de ([\d.,]+)€/)
          if (priceMatch) {
            startingPrice = parseFloat(priceMatch[1].replace(',', '.'))
          }
        }
        
        // Extraire la capacité correcte
        let maxCapacity = establishment.maxCapacity
        if (venue.capacity) {
          // Extraire le nombre maximum de la capacité
          const capacityMatch = venue.capacity.match(/(\d+)\s*-\s*(\d+)/)
          if (capacityMatch) {
            maxCapacity = parseInt(capacityMatch[2]) // Prendre le maximum
          } else {
            // Si pas de range, chercher un nombre simple
            const singleCapacityMatch = venue.capacity.match(/(\d+)/)
            if (singleCapacityMatch) {
              maxCapacity = parseInt(singleCapacityMatch[1])
            }
          }
        }
        
        // Mettre à jour les données
        await prisma.establishment.update({
          where: { id: establishment.id },
          data: {
            startingPrice,
            maxCapacity
          }
        })
        
        console.log(`✅ ${venue.name}:`)
        console.log(`   Prix: ${establishment.startingPrice}€ → ${startingPrice}€`)
        console.log(`   Capacité: ${establishment.maxCapacity} → ${maxCapacity} personnes`)
        updatedCount++
        
      } catch (error) {
        console.error(`❌ Erreur pour ${venue.name}:`, error)
        errorCount++
      }
    }
    
    console.log(`\n📊 Résumé:`)
    console.log(`✅ ${updatedCount} établissements mis à jour`)
    console.log(`❌ ${notFoundCount} établissements non trouvés`)
    console.log(`⚠️ ${errorCount} erreurs`)
    
    // Vérifier quelques exemples après correction
    console.log(`\n🔍 Vérification des corrections:`)
    const sampleEstablishments = await prisma.establishment.findMany({
      take: 10,
      select: {
        name: true,
        startingPrice: true,
        maxCapacity: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    sampleEstablishments.forEach(est => {
      console.log(`- ${est.name}: ${est.startingPrice}€, ${est.maxCapacity} personnes`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
updateEstablishmentData()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

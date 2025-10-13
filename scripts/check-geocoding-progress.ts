import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function checkGeocodingProgress() {
  console.log('🔍 Vérification du progrès de géolocalisation...\n')
  
  try {
    // Vérifier le fichier de progrès
    const progressFile = path.join(process.cwd(), 'geocoding-progress.json')
    
    if (fs.existsSync(progressFile)) {
      const data = fs.readFileSync(progressFile, 'utf8')
      const progress = JSON.parse(data)
      
      console.log('📂 PROGRÈS SAUVEGARDÉ:')
      console.log(`📍 Partenaires traités: ${progress.processedPartners}/${progress.totalPartners}`)
      console.log(`✅ Succès: ${progress.successfulGeocoding}`)
      console.log(`❌ Échecs: ${progress.failedGeocoding}`)
      console.log(`📈 Taux de succès: ${((progress.successfulGeocoding / progress.processedPartners) * 100).toFixed(2)}%`)
      console.log(`🔄 Dernier ID traité: ${progress.lastProcessedId}`)
      
      const remaining = progress.totalPartners - progress.processedPartners
      const percentage = ((progress.processedPartners / progress.totalPartners) * 100).toFixed(1)
      
      console.log(`\n⏳ RESTANT: ${remaining} partenaires (${percentage}% terminé)`)
      
      if (remaining > 0) {
        const estimatedHours = (remaining * 1) / 3600 // 1 seconde par partenaire
        console.log(`⏱️  Temps estimé restant: ${estimatedHours.toFixed(1)} heures`)
        
        console.log('\n💡 COMMANDES DISPONIBLES:')
        console.log('🔄 Reprendre: npx tsx scripts/geocode-partners-resumable.ts')
        console.log('🗑️  Recommencer: rm geocoding-progress.json && npx tsx scripts/geocode-partners-resumable.ts')
        console.log('📊 Vérifier statut: npx tsx scripts/check-geocoding-status.ts')
      } else {
        console.log('\n🎉 Géolocalisation terminée !')
        console.log('🗑️  Vous pouvez supprimer le fichier de progrès: rm geocoding-progress.json')
      }
    } else {
      console.log('📂 Aucun fichier de progrès trouvé')
      
      // Vérifier le statut actuel
      const totalPartners = await prisma.partner.count()
      const partnersWithCoords = await prisma.partner.count({
        where: {
          AND: [
            { latitude: { not: { isSet: false } } },
            { longitude: { not: { isSet: false } } }
          ]
        }
      })
      const partnersWithoutCoords = totalPartners - partnersWithCoords
      
      console.log('\n📊 STATUT ACTUEL:')
      console.log(`📍 Total partenaires: ${totalPartners}`)
      console.log(`✅ Avec coordonnées: ${partnersWithCoords}`)
      console.log(`❌ Sans coordonnées: ${partnersWithoutCoords}`)
      console.log(`📈 Taux de géolocalisation: ${((partnersWithCoords / totalPartners) * 100).toFixed(1)}%`)
      
      if (partnersWithoutCoords > 0) {
        console.log('\n💡 COMMANDES DISPONIBLES:')
        console.log('🚀 Commencer: npx tsx scripts/geocode-partners-resumable.ts')
        console.log('🧪 Tester: npx tsx scripts/test-geocode-partners.ts 5')
      } else {
        console.log('\n🎉 Tous les partenaires sont géolocalisés !')
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  checkGeocodingProgress()
    .then(() => {
      console.log('\n✅ Vérification terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { checkGeocodingProgress }


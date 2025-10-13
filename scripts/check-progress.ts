import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProgress() {
  try {
    console.log('📊 Vérification de l\'avancement de la correction des images...')
    
    // Compter les établissements avec des images qui fonctionnent
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true
      },
      take: 100 // Échantillon pour vérifier
    })
    
    let workingImages = 0
    let totalImages = 0
    let establishmentsWithWorkingImages = 0
    
    console.log(`🔍 Vérification d'un échantillon de ${establishments.length} établissements...`)
    
    for (const establishment of establishments) {
      if (!establishment.images || establishment.images.length === 0) {
        continue
      }
      
      let establishmentHasWorkingImages = false
      
      for (const imageUrl of establishment.images.slice(0, 3)) { // Tester les 3 premières images
        totalImages++
        
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' })
          if (response.ok) {
            workingImages++
            establishmentHasWorkingImages = true
          }
        } catch (error) {
          // Image ne fonctionne pas
        }
      }
      
      if (establishmentHasWorkingImages) {
        establishmentsWithWorkingImages++
      }
    }
    
    const successRate = totalImages > 0 ? ((workingImages / totalImages) * 100).toFixed(1) : 0
    const establishmentRate = establishments.length > 0 ? ((establishmentsWithWorkingImages / establishments.length) * 100).toFixed(1) : 0
    
    console.log(`\n📈 RÉSULTATS DE L'ÉCHANTILLON:`)
    console.log(`- Images fonctionnelles: ${workingImages}/${totalImages} (${successRate}%)`)
    console.log(`- Établissements avec images: ${establishmentsWithWorkingImages}/${establishments.length} (${establishmentRate}%)`)
    
    // Estimation du progrès global
    const totalEstablishments = await prisma.establishment.count()
    const estimatedProgress = ((establishmentsWithWorkingImages / establishments.length) * totalEstablishments).toFixed(0)
    
    console.log(`\n🎯 ESTIMATION GLOBALE:`)
    console.log(`- Établissements corrigés estimés: ~${estimatedProgress}/${totalEstablishments}`)
    
    if (parseFloat(successRate) > 80) {
      console.log(`\n✅ Excellent progrès ! La plupart des images fonctionnent maintenant.`)
    } else if (parseFloat(successRate) > 50) {
      console.log(`\n🔄 Bon progrès ! Le script continue de corriger les URLs.`)
    } else {
      console.log(`\n⏳ Le script est encore en cours d'exécution...`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProgress()

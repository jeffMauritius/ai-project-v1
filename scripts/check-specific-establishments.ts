import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSpecificEstablishments() {
  try {
    console.log('🔍 Vérification d\'établissements spécifiques...')
    
    // Récupérer quelques établissements récemment modifiés
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    })
    
    console.log(`📊 Vérification des 10 établissements les plus récemment modifiés:`)
    
    for (const establishment of establishments) {
      console.log(`\n📍 ${establishment.name} (${establishment.id})`)
      console.log(`   Modifié: ${establishment.updatedAt}`)
      
      if (!establishment.images || establishment.images.length === 0) {
        console.log(`   ❌ Aucune image`)
        continue
      }
      
      console.log(`   Images: ${establishment.images.length}`)
      
      // Tester les 3 premières images
      let workingImages = 0
      for (let i = 0; i < Math.min(3, establishment.images.length); i++) {
        const imageUrl = establishment.images[i]
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' })
          if (response.ok) {
            workingImages++
            console.log(`   ✅ Image ${i + 1}: OK`)
          } else {
            console.log(`   ❌ Image ${i + 1}: ${response.status}`)
          }
        } catch (error) {
          console.log(`   ❌ Image ${i + 1}: Erreur`)
        }
      }
      
      const successRate = ((workingImages / Math.min(3, establishment.images.length)) * 100).toFixed(0)
      console.log(`   📊 Taux de succès: ${successRate}%`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSpecificEstablishments()

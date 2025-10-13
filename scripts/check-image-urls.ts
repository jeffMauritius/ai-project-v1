import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkImageUrls() {
  try {
    console.log('🔍 Vérification des URLs d\'images...')
    
    // Récupérer quelques établissements avec leurs images
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true
      },
      take: 5
    })
    
    for (const establishment of establishments) {
      console.log(`\n📍 ${establishment.name} (${establishment.id}):`)
      
      if (establishment.images && establishment.images.length > 0) {
        console.log(`   Images: ${establishment.images.length}`)
        
        // Tester la première image
        const firstImage = establishment.images[0]
        console.log(`   Première image: ${firstImage}`)
        
        try {
          const response = await fetch(firstImage, { method: 'HEAD' })
          console.log(`   Status: ${response.status} ${response.statusText}`)
          
          if (response.ok) {
            console.log(`   ✅ Image accessible`)
          } else {
            console.log(`   ❌ Image non accessible`)
          }
        } catch (error) {
          console.log(`   ❌ Erreur: ${error}`)
        }
      } else {
        console.log(`   ❌ Aucune image`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkImageUrls()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugImageUrls() {
  try {
    console.log('🔍 Debug détaillé des URLs d\'images...')
    
    // Récupérer quelques établissements avec leurs images
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true
      },
      take: 3
    })
    
    for (const establishment of establishments) {
      console.log(`\n📍 ${establishment.name} (${establishment.id}):`)
      
      if (establishment.images && establishment.images.length > 0) {
        console.log(`   Images: ${establishment.images.length}`)
        
        // Analyser toutes les images
        for (let i = 0; i < Math.min(3, establishment.images.length); i++) {
          const imageUrl = establishment.images[i]
          console.log(`   Image ${i + 1}: ${imageUrl}`)
          
          try {
            const response = await fetch(imageUrl, { method: 'HEAD' })
            console.log(`     Status: ${response.status} ${response.statusText}`)
            
            if (response.status === 404) {
              // Essayer de deviner l'URL correcte
              console.log(`     ❌ 404 - Tentative de correction...`)
              
              // Extraire le nom de fichier
              const urlParts = imageUrl.split('/')
              const fileName = urlParts[urlParts.length - 1]
              const baseUrl = imageUrl.replace(fileName, '')
              
              console.log(`     Base URL: ${baseUrl}`)
              console.log(`     File name: ${fileName}`)
              
              // Essayer différentes variantes
              const variants = [
                fileName.replace('.webp', '.jpg'),
                fileName.replace('.webp', '.jpeg'),
                fileName.replace('.webp', '.png'),
                `image-${i + 1}.webp`,
                `image-${i + 1}.jpg`,
                `image-${i + 1}.jpeg`,
                `image-${i + 1}.png`
              ]
              
              for (const variant of variants) {
                const testUrl = baseUrl + variant
                try {
                  const testResponse = await fetch(testUrl, { method: 'HEAD' })
                  if (testResponse.ok) {
                    console.log(`     ✅ Trouvé: ${testUrl}`)
                    break
                  }
                } catch (e) {
                  // Ignorer les erreurs de test
                }
              }
            } else if (response.ok) {
              console.log(`     ✅ Image accessible`)
            }
          } catch (error) {
            console.log(`     ❌ Erreur: ${error}`)
          }
        }
      } else {
        console.log(`   ❌ Aucune image`)
      }
    }
    
    // Vérifier s'il y a des patterns dans les URLs
    console.log('\n🔍 Analyse des patterns d\'URLs...')
    const allImages = establishments.flatMap(e => e.images || [])
    const urlPatterns = new Set()
    
    allImages.forEach(url => {
      const parts = url.split('/')
      if (parts.length > 0) {
        const pattern = parts.slice(0, -1).join('/') + '/'
        urlPatterns.add(pattern)
      }
    })
    
    console.log(`Patterns d'URLs trouvés:`)
    urlPatterns.forEach(pattern => {
      console.log(`- ${pattern}`)
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugImageUrls()

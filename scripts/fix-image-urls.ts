import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixImageUrls() {
  try {
    console.log('🔧 Correction des URLs d\'images des établissements...')
    
    // Récupérer tous les établissements avec leurs images
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true
      }
    })
    
    console.log(`📊 ${establishments.length} établissements à vérifier`)
    
    let fixedCount = 0
    let totalChecked = 0
    
    for (const establishment of establishments) {
      totalChecked++
      
      if (totalChecked % 100 === 0) {
        console.log(`📈 Progrès: ${totalChecked}/${establishments.length} établissements vérifiés`)
      }
      
      if (!establishment.images || establishment.images.length === 0) {
        continue
      }
      
      const correctedImages: string[] = []
      let hasChanges = false
      
      for (let i = 0; i < establishment.images.length; i++) {
        const originalUrl = establishment.images[i]
        
        // Vérifier si l'URL originale fonctionne
        try {
          const response = await fetch(originalUrl, { method: 'HEAD' })
          if (response.ok) {
            correctedImages.push(originalUrl)
            continue
          }
        } catch (error) {
          // URL ne fonctionne pas, essayer de la corriger
        }
        
        // Extraire les parties de l'URL
        const urlParts = originalUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const baseUrl = originalUrl.replace(fileName, '')
        
        // Essayer différentes variantes de noms de fichiers
        const variants = [
          // Avec hash (format qui fonctionne)
          `image-${i + 1}-${generateRandomHash()}.webp`,
          `image-${i + 1}-${generateRandomHash()}.jpg`,
          `image-${i + 1}-${generateRandomHash()}.jpeg`,
          `image-${i + 1}-${generateRandomHash()}.png`,
          
          // Sans hash mais différents formats
          `image-${i + 1}.jpg`,
          `image-${i + 1}.jpeg`,
          `image-${i + 1}.png`,
          
          // Formats avec numérotation différente
          `image${i + 1}.webp`,
          `image${i + 1}.jpg`,
          `img-${i + 1}.webp`,
          `img-${i + 1}.jpg`,
        ]
        
        let foundUrl = null
        
        for (const variant of variants) {
          const testUrl = baseUrl + variant
          try {
            const testResponse = await fetch(testUrl, { method: 'HEAD' })
            if (testResponse.ok) {
              foundUrl = testUrl
              break
            }
          } catch (error) {
            // Ignorer les erreurs de test
          }
        }
        
        if (foundUrl) {
          correctedImages.push(foundUrl)
          hasChanges = true
        } else {
          // Garder l'URL originale même si elle ne fonctionne pas
          correctedImages.push(originalUrl)
        }
      }
      
      // Mettre à jour la base de données si des changements ont été faits
      if (hasChanges) {
        try {
          await prisma.establishment.update({
            where: { id: establishment.id },
            data: { images: correctedImages }
          })
          fixedCount++
          
          if (fixedCount % 10 === 0) {
            console.log(`✅ ${fixedCount} établissements corrigés`)
          }
        } catch (error) {
          console.error(`❌ Erreur lors de la mise à jour de ${establishment.name}:`, error)
        }
      }
      
      // Délai pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`\n🎉 Correction terminée !`)
    console.log(`📊 ${fixedCount} établissements corrigés sur ${establishments.length} vérifiés`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function generateRandomHash(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

fixImageUrls()

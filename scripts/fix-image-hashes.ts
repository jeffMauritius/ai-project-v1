import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'

const prisma = new PrismaClient()

async function fixImageHashes() {
  console.log('🔧 Correction des hash des images...')
  console.log('===================================')

  try {
    // Récupérer tous les partenaires avec des images
    const partners = await prisma.partner.findMany({
      where: {
        images: {
          not: null,
          not: []
        }
      },
      select: {
        id: true,
        companyName: true,
        images: true
      }
    })

    console.log(`📊 ${partners.length} partenaires avec des images trouvés`)

    let totalFixed = 0
    let totalPartnersProcessed = 0

    for (const partner of partners) {
      console.log(`\n🔍 Traitement de ${partner.companyName}...`)
      
      if (!partner.images || partner.images.length === 0) {
        console.log('  ⏭️  Aucune image, ignoré')
        continue
      }

      const correctedImages: string[] = []
      let fixedCount = 0

      // Pour chaque image, essayer de trouver la bonne URL
      for (let i = 0; i < partner.images.length; i++) {
        const currentUrl = partner.images[i]
        
        try {
          // Tester l'URL actuelle
          const response = await fetch(currentUrl, { method: 'HEAD' })
          
          if (response.ok) {
            console.log(`  ✅ Image ${i + 1}: URL correcte`)
            correctedImages.push(currentUrl)
          } else {
            console.log(`  🔍 Image ${i + 1}: URL incorrecte (${response.status}), recherche de l'alternative...`)
            
            // Extraire le nom de base de l'image
            const urlParts = currentUrl.split('/')
            const filename = urlParts[urlParts.length - 1]
            const baseName = filename.split('-')[0] + '-' + filename.split('-')[1] // image-1, image-2, etc.
            
            // Essayer différentes variations de hash
            const possibleHashes = [
              'gR7wUN48j7FtEEiGwyiiRZfgb8jJVa',
              'C7fwk8qK1lmpt9lLxuSDXP7Hlnlqb4',
              'Ym9ghm9DmBhc9oYkpksmUN1QcmMXVl',
              'CVYVAPCnm5cfpZ9g2wgH8q8KQFYftW',
              'MYLXTrHpKTK9mVaUckNSoSfEaXFsiS',
              'KSzBxHfohZH0tW7tJXTBaouMk4hUJm',
              'BaaaaM7U7buXwbMF1kMzVc21iRvo5p',
              'IHmcg6jree8SuHLEtEi7hOfJ7kSSEZ',
              'DBncQajP9AeuUTcIP46ufGLShkWjYG',
              'pN6YDU9cGICwkuB4fFBKOuJD18nzyx',
              'qLjugnhlEkygAa56EvleeBPnz0CtQo',
              'R2jE3q0phD3b0gRpf24Pn35YL2W2M2',
              'MB7ldNqjToMtWY6GDMU5p9u4AGe4Nx'
            ]
            
            let found = false
            for (const hash of possibleHashes) {
              const testUrl = currentUrl.replace(filename, `${baseName}-${hash}.webp`)
              
              try {
                const testResponse = await fetch(testUrl, { method: 'HEAD' })
                if (testResponse.ok) {
                  console.log(`  ✅ Image ${i + 1}: URL corrigée avec hash ${hash}`)
                  correctedImages.push(testUrl)
                  fixedCount++
                  found = true
                  break
                }
              } catch (error) {
                // Continuer avec le hash suivant
              }
            }
            
            if (!found) {
              console.log(`  ❌ Image ${i + 1}: Aucune alternative trouvée`)
              // Garder l'URL originale même si elle ne fonctionne pas
              correctedImages.push(currentUrl)
            }
          }
        } catch (error) {
          console.log(`  ❌ Image ${i + 1}: Erreur - ${error.message}`)
          correctedImages.push(currentUrl)
        }
      }

      // Mettre à jour si des corrections ont été apportées
      if (fixedCount > 0) {
        await prisma.partner.update({
          where: { id: partner.id },
          data: { images: correctedImages }
        })
        
        console.log(`  🔧 ${fixedCount} images corrigées`)
        totalFixed += fixedCount
      } else {
        console.log(`  ✅ Toutes les images sont correctes`)
      }

      totalPartnersProcessed++
      
      // Pause pour éviter de surcharger
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n🎉 CORRECTION TERMINÉE !')
    console.log('========================')
    console.log(`📊 Partenaires traités: ${totalPartnersProcessed}`)
    console.log(`🔧 Images corrigées: ${totalFixed}`)

  } catch (error: any) {
    console.error('💥 Erreur lors de la correction:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixImageHashes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

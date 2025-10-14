import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'

const prisma = new PrismaClient()

// Liste des hash possibles basés sur l'analyse de Vercel Blob
const POSSIBLE_HASHES = [
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
  'MB7ldNqjToMtWY6GDMU5p9u4AGe4Nx',
  'F9Rse8TQ29IvX7bzHQPvUjLJgX7yiM',
  'lUhCZNOxuP1gpxTRKUyHEQDSZWAD0X',
  'ECpK8jUo2wQ72U0AYrFwOjZKGaDwWu',
  'aWFhduga8zaXciqXh9vtmB5qbhuurX'
]

async function testImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}

async function findCorrectHash(baseUrl: string, imageNumber: number): Promise<string | null> {
  const urlParts = baseUrl.split('/')
  const filename = urlParts[urlParts.length - 1]
  const baseName = filename.split('-')[0] + '-' + filename.split('-')[1]
  
  // Tester d'abord l'URL actuelle
  if (await testImageUrl(baseUrl)) {
    return baseUrl
  }
  
  // Tester avec différents hash
  for (const hash of POSSIBLE_HASHES) {
    const testUrl = baseUrl.replace(filename, `${baseName}-${hash}.webp`)
    if (await testImageUrl(testUrl)) {
      return testUrl
    }
  }
  
  return null
}

async function fixImageHashes() {
  console.log('🔧 Correction complète des hash des images...')
  console.log('============================================')

  try {
    // Récupérer tous les partenaires avec des images
    const partners = await prisma.partner.findMany({
      where: {
        images: {
          isEmpty: false
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
    let totalImagesFixed = 0

    for (const partner of partners) {
      console.log(`\n🔍 Traitement de ${partner.companyName}...`)
      
      if (!partner.images || partner.images.length === 0) {
        console.log('  ⏭️  Aucune image, ignoré')
        continue
      }

      // Vérifier si toutes les images ont le même hash
      const hashes = partner.images.map(url => {
        const parts = url.split('/')
        const filename = parts[parts.length - 1]
        const hashPart = filename.split('-').slice(2).join('-').replace('.webp', '')
        return hashPart
      })

      const uniqueHashes = [...new Set(hashes)]
      
      if (uniqueHashes.length === 1) {
        console.log(`  🔍 Toutes les images ont le même hash: ${uniqueHashes[0]}`)
        console.log(`  🔧 Correction en cours...`)

        const correctedImages: string[] = []
        let imagesFixed = 0

        for (let i = 0; i < partner.images.length; i++) {
          const currentUrl = partner.images[i]
          const correctUrl = await findCorrectHash(currentUrl, i + 1)
          
          if (correctUrl) {
            correctedImages.push(correctUrl)
            if (correctUrl !== currentUrl) {
              imagesFixed++
              console.log(`    ✅ Image ${i + 1}: Hash corrigé`)
            } else {
              console.log(`    ✅ Image ${i + 1}: Hash correct`)
            }
          } else {
            console.log(`    ❌ Image ${i + 1}: Aucune alternative trouvée`)
            correctedImages.push(currentUrl)
          }
        }

        if (imagesFixed > 0) {
          await prisma.partner.update({
            where: { id: partner.id },
            data: { images: correctedImages }
          })

          console.log(`  🎉 ${imagesFixed} images corrigées sur ${partner.images.length}`)
          totalImagesFixed += imagesFixed
          totalFixed++
        } else {
          console.log(`  ✅ Toutes les images sont correctes`)
        }
      } else {
        console.log(`  ✅ Hash variés détectés: ${uniqueHashes.length} différents`)
      }

      totalPartnersProcessed++

      // Pause pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n🎉 CORRECTION TERMINÉE !')
    console.log('========================')
    console.log(`📊 Partenaires traités: ${totalPartnersProcessed}`)
    console.log(`🔧 Partenaires corrigés: ${totalFixed}`)
    console.log(`🖼️  Images corrigées: ${totalImagesFixed}`)

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

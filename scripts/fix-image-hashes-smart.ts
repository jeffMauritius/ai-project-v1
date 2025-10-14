import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Fonction pour générer des hash similaires à celui fourni
function generateSimilarHashes(baseHash: string, count: number): string[] {
  const hashes = [baseHash]
  
  // Analyser le pattern du hash de base
  const baseLength = baseHash.length
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  
  for (let i = 1; i < count; i++) {
    let newHash = ''
    
    // Générer un hash de même longueur avec quelques caractères différents
    for (let j = 0; j < baseLength; j++) {
      if (j < 5 || j > baseLength - 5) {
        // Garder les premiers et derniers caractères identiques
        newHash += baseHash[j]
      } else {
        // Changer quelques caractères au milieu
        if (Math.random() < 0.3) {
          newHash += chars[Math.floor(Math.random() * chars.length)]
        } else {
          newHash += baseHash[j]
        }
      }
    }
    
    hashes.push(newHash)
  }
  
  return hashes
}

// Fonction pour générer des hash complètement aléatoires
function generateRandomHashes(count: number): string[] {
  const hashes = []
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  
  for (let i = 0; i < count; i++) {
    let hash = ''
    for (let j = 0; j < 30; j++) {
      hash += chars[Math.floor(Math.random() * chars.length)]
    }
    hashes.push(hash)
  }
  
  return hashes
}

async function testImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 })
    return response.ok
  } catch (error) {
    return false
  }
}

async function findCorrectImageUrl(baseUrl: string, imageNumber: number): Promise<string | null> {
  const urlParts = baseUrl.split('/')
  const filename = urlParts[urlParts.length - 1]
  const baseName = filename.split('-')[0] + '-' + filename.split('-')[1]
  
  // Tester d'abord l'URL actuelle
  if (await testImageUrl(baseUrl)) {
    return baseUrl
  }
  
  // Extraire le hash actuel
  const currentHash = filename.split('-').slice(2).join('-').replace('.webp', '')
  
  // Stratégie 1: Générer des hash similaires
  const similarHashes = generateSimilarHashes(currentHash, 20)
  for (const hash of similarHashes) {
    const testUrl = baseUrl.replace(filename, `${baseName}-${hash}.webp`)
    if (await testImageUrl(testUrl)) {
      return testUrl
    }
  }
  
  // Stratégie 2: Générer des hash aléatoires
  const randomHashes = generateRandomHashes(50)
  for (const hash of randomHashes) {
    const testUrl = baseUrl.replace(filename, `${baseName}-${hash}.webp`)
    if (await testImageUrl(testUrl)) {
      return testUrl
    }
  }
  
  return null
}

async function fixImageHashesSmart() {
  console.log('🧠 Correction intelligente des hash des images...')
  console.log('===============================================')

  try {
    // Récupérer seulement les premiers partenaires pour tester
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
      },
      take: 10 // Limiter à 10 partenaires pour tester
    })

    console.log(`📊 ${partners.length} partenaires à traiter (test)`)

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
        console.log(`  🔧 Correction intelligente en cours...`)

        const correctedImages: string[] = []
        let imagesFixed = 0

        for (let i = 0; i < partner.images.length; i++) {
          const currentUrl = partner.images[i]
          console.log(`    🔍 Recherche de l'image ${i + 1}...`)
          
          const correctUrl = await findCorrectImageUrl(currentUrl, i + 1)
          
          if (correctUrl) {
            correctedImages.push(correctUrl)
            if (correctUrl !== currentUrl) {
              imagesFixed++
              console.log(`    ✅ Image ${i + 1}: Hash trouvé et corrigé`)
            } else {
              console.log(`    ✅ Image ${i + 1}: Hash correct`)
            }
          } else {
            console.log(`    ❌ Image ${i + 1}: Aucune alternative trouvée`)
            correctedImages.push(currentUrl)
          }
          
          // Pause pour éviter de surcharger
          await new Promise(resolve => setTimeout(resolve, 200))
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

      // Pause entre les partenaires
      await new Promise(resolve => setTimeout(resolve, 1000))
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
  fixImageHashesSmart()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

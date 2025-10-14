import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function fixAllPartnerImageUrls() {
  console.log('🚀 Correction complète des URLs d\'images partenaires...')
  console.log('======================================================')
  
  try {
    // Récupérer les partenaires avec images
    const partners = await prisma.partner.findMany({
      where: {
        storefronts: {
          some: {
            images: { isEmpty: false }
          }
        }
      },
      select: {
        id: true,
        companyName: true,
        storefronts: {
          select: {
            id: true,
            images: true
          },
          take: 1
        }
      },
      take: 100 // Commencer par 100 partenaires
    })

    console.log(`📊 ${partners.length} partenaires à traiter`)
    console.log('')

    let fixedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i]
      const storefront = partner.storefronts[0]
      
      console.log(`🔍 [${i+1}/${partners.length}] ${partner.companyName}`)
      console.log(`   Partner ID: ${partner.id}`)
      console.log(`   Storefront ID: ${storefront.id}`)
      console.log(`   Images actuelles: ${storefront.images.length}`)

      try {
        // Lister les fichiers réels sur Vercel Blob
        console.log(`   📡 Récupération des fichiers Vercel Blob...`)
        const { blobs } = await list({ 
          prefix: `partners/${partner.id}/960/`,
          limit: 20 
        })

        if (blobs.length === 0) {
          console.log(`   ⚠️  Aucun fichier trouvé sur Vercel Blob`)
          skippedCount++
          console.log('')
          continue
        }

        console.log(`   📁 ${blobs.length} fichiers trouvés sur Vercel Blob`)

        // Créer un mapping des images réelles
        const realImages = blobs.map(blob => blob.url)
        
        // Vérifier si les URLs en base correspondent aux vrais fichiers
        const currentImages = storefront.images || []
        let hasChanges = false
        const correctedImages: string[] = []

        // Mapper les images existantes avec les vraies images
        for (let j = 0; j < Math.max(currentImages.length, realImages.length); j++) {
          const currentUrl = currentImages[j]
          const realUrl = realImages[j]

          if (realUrl) {
            correctedImages.push(realUrl)
            if (currentUrl !== realUrl) {
              hasChanges = true
              console.log(`   🔄 Image ${j + 1}: ${currentUrl.split('/').pop()} -> ${realUrl.split('/').pop()}`)
            }
          } else if (currentUrl) {
            // Garder l'URL existante si pas de correspondance
            correctedImages.push(currentUrl)
          }
        }

        if (hasChanges) {
          // Mettre à jour les images dans le storefront
          await prisma.partnerStorefront.update({
            where: { id: storefront.id },
            data: { images: correctedImages }
          })
          
          console.log(`   ✅ URLs corrigées pour ${partner.companyName}`)
          fixedCount++
        } else {
          console.log(`   ⏭️  URLs déjà correctes`)
          skippedCount++
        }

      } catch (error: any) {
        console.error(`   ❌ Erreur pour ${partner.companyName}:`, error.message)
        errorCount++
      }

      console.log('')
      
      // Pause entre les requêtes pour éviter les limites de taux
      if (i < partners.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 seconde
      }
    }

    console.log('📊 RÉSULTATS FINAUX:')
    console.log('===================')
    console.log(`✅ Corrigés: ${fixedCount}`)
    console.log(`⏭️  Ignorés: ${skippedCount}`)
    console.log(`❌ Erreurs: ${errorCount}`)
    console.log(`📈 Total: ${fixedCount + skippedCount + errorCount}`)
    console.log(`🎯 Taux de succès: ${((fixedCount / partners.length) * 100).toFixed(1)}%`)

  } catch (error) {
    console.error('💥 Erreur fatale:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Déconnexion de la base de données')
  }
}

if (require.main === module) {
  fixAllPartnerImageUrls()
    .then(() => {
      console.log('🎉 Script terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur:', error)
      process.exit(1)
    })
}

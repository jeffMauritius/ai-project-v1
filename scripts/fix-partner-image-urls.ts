import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function fixPartnerImageUrls() {
  console.log('🔧 Correction des URLs d\'images des partenaires...')
  console.log('==================================================')

  try {
    // Récupérer les partenaires avec des images dans leurs storefronts
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
      take: 10 // Commencer par un échantillon
    })

    console.log(`📊 ${partners.length} partenaires à vérifier`)

    let fixedCount = 0
    let skippedCount = 0

    for (const partner of partners) {
      const storefront = partner.storefronts[0]
      console.log(`\n🔍 Partenaire: ${partner.companyName}`)
      console.log(`   Partner ID: ${partner.id}`)
      console.log(`   Storefront ID: ${storefront.id}`)

      try {
        // Lister les fichiers réels sur Vercel Blob
        const { blobs } = await list({ 
          prefix: `partners/${partner.id}/960/`,
          limit: 20 
        })

        if (blobs.length === 0) {
          console.log('   ⚠️  Aucun fichier trouvé sur Vercel Blob')
          skippedCount++
          continue
        }

        console.log(`   📁 ${blobs.length} fichiers trouvés sur Vercel Blob`)

        // Créer un mapping des images existantes
        const realImages = blobs.map(blob => blob.url)
        
        // Vérifier si les URLs en base correspondent aux vrais fichiers
        const currentImages = storefront.images || []
        let hasChanges = false
        const correctedImages: string[] = []

        for (let i = 0; i < Math.max(currentImages.length, realImages.length); i++) {
          const currentUrl = currentImages[i]
          const realUrl = realImages[i]

          if (realUrl) {
            correctedImages.push(realUrl)
            if (currentUrl !== realUrl) {
              hasChanges = true
              console.log(`   🔄 Image ${i + 1}: ${currentUrl} -> ${realUrl}`)
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
        skippedCount++
      }
    }

    console.log('\n📊 RÉSULTATS:')
    console.log('=============')
    console.log(`✅ Corrigés: ${fixedCount}`)
    console.log(`⏭️  Ignorés: ${skippedCount}`)
    console.log(`📈 Total: ${fixedCount + skippedCount}`)

  } catch (error) {
    console.error('💥 Erreur fatale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixPartnerImageUrls()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

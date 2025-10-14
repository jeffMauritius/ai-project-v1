import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPartnerUrlsSimple() {
  console.log('🔧 Correction simple des URLs partenaires...')
  console.log('=============================================')
  
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
      take: 50 // Commencer par 50 partenaires
    })

    console.log(`📊 ${partners.length} partenaires à corriger`)
    console.log('')

    let fixedCount = 0
    let skippedCount = 0

    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i]
      const storefront = partner.storefronts[0]
      
      console.log(`🔍 [${i+1}/${partners.length}] ${partner.companyName}`)
      console.log(`   Partner ID: ${partner.id}`)
      console.log(`   Storefront ID: ${storefront.id}`)
      console.log(`   Images: ${storefront.images.length}`)

      // Corriger les URLs
      const correctedImages = storefront.images.map((url, index) => {
        if (url && url.includes('blob.vercel-storage.com')) {
          // Remplacer l'ID du storefront par l'ID du partner
          let correctedUrl = url.replace(
            `/partners/${storefront.id}/`,
            `/partners/${partner.id}/`
          )
          
          // Remplacer le format de nom de fichier
          // De: 68bed5d872afc59ca2deb5fa_1-K9G5LClGXPBKk0fml6zQjN58EkkTZN.webp
          // Vers: image-1-K9G5LClGXPBKk0fml6zQjN58EkkTZN.webp
          correctedUrl = correctedUrl.replace(
            /\/\d+_[^-]+-([^.]+\.webp)$/,
            `/image-${index + 1}-$1`
          )
          
          console.log(`   🔄 Image ${index + 1}: ${url.split('/').pop()} -> ${correctedUrl.split('/').pop()}`)
          return correctedUrl
        }
        return url
      })

      // Vérifier s'il y a des changements
      const hasChanges = correctedImages.some((url, index) => url !== storefront.images[index])
      
      if (hasChanges) {
        // Mettre à jour en base
        await prisma.partnerStorefront.update({
          where: { id: storefront.id },
          data: { images: correctedImages }
        })

        console.log(`   ✅ URLs corrigées`)
        fixedCount++
      } else {
        console.log(`   ⏭️  URLs déjà correctes`)
        skippedCount++
      }

      console.log('')
      
      // Pause entre les mises à jour
      if (i < partners.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 0.5 seconde
      }
    }

    console.log('📊 RÉSULTATS:')
    console.log('=============')
    console.log(`✅ Corrigés: ${fixedCount}`)
    console.log(`⏭️  Ignorés: ${skippedCount}`)
    console.log(`📈 Total: ${fixedCount + skippedCount}`)

  } catch (error) {
    console.error('💥 Erreur:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Déconnexion de la base de données')
  }
}

if (require.main === module) {
  fixPartnerUrlsSimple()
    .then(() => {
      console.log('🎉 Script terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur:', error)
      process.exit(1)
    })
}

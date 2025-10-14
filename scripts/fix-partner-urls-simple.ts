import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPartnerUrlsSimple() {
  console.log('🔧 Correction simple des URLs partenaires...')
  
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
      take: 50 // Commencer par un échantillon
    })

    console.log(`📊 ${partners.length} partenaires à corriger`)

    let fixedCount = 0

    for (const partner of partners) {
      const storefront = partner.storefronts[0]
      console.log(`\n🔍 ${partner.companyName}`)
      
      // Corriger les URLs
      const correctedImages = storefront.images.map(url => {
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
            '/image-1-$1'
          )
          
          return correctedUrl
        }
        return url
      })

      // Mettre à jour en base
      await prisma.partnerStorefront.update({
        where: { id: storefront.id },
        data: { images: correctedImages }
      })

      console.log(`   ✅ URLs corrigées`)
      fixedCount++
    }

    console.log(`\n🎉 ${fixedCount} partenaires corrigés !`)

  } catch (error) {
    console.error('💥 Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixPartnerUrlsSimple()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

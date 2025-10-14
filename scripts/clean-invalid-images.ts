import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'

const prisma = new PrismaClient()

async function cleanInvalidImages() {
  console.log('🧹 Nettoyage des images invalides...')
  console.log('====================================')

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

    let totalCleaned = 0
    let totalPartnersProcessed = 0

    for (const partner of partners) {
      console.log(`\n🔍 Traitement de ${partner.companyName}...`)
      
      if (!partner.images || partner.images.length === 0) {
        console.log('  ⏭️  Aucune image, ignoré')
        continue
      }

      const validImages: string[] = []
      let invalidCount = 0

      // Tester chaque image
      for (let i = 0; i < partner.images.length; i++) {
        const imageUrl = partner.images[i]
        
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' })
          
          if (response.ok) {
            validImages.push(imageUrl)
            console.log(`  ✅ Image ${i + 1}: OK`)
          } else {
            console.log(`  ❌ Image ${i + 1}: ${response.status}`)
            invalidCount++
          }
        } catch (error) {
          console.log(`  ❌ Image ${i + 1}: Erreur - ${error.message}`)
          invalidCount++
        }
      }

      // Mettre à jour si des images ont été supprimées
      if (invalidCount > 0) {
        await prisma.partner.update({
          where: { id: partner.id },
          data: { images: validImages }
        })
        
        console.log(`  🧹 ${invalidCount} images invalides supprimées`)
        console.log(`  📸 ${validImages.length} images valides conservées`)
        totalCleaned += invalidCount
      } else {
        console.log(`  ✅ Toutes les images sont valides`)
      }

      totalPartnersProcessed++
      
      // Pause pour éviter de surcharger
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n🎉 NETTOYAGE TERMINÉ !')
    console.log('======================')
    console.log(`📊 Partenaires traités: ${totalPartnersProcessed}`)
    console.log(`🧹 Images invalides supprimées: ${totalCleaned}`)

  } catch (error: any) {
    console.error('💥 Erreur lors du nettoyage:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  cleanInvalidImages()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

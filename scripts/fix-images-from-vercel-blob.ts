import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function fixImagesFromVercelBlob() {
  console.log('🔧 Correction des images depuis Vercel Blob...')
  console.log('=============================================')

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
      },
      take: 5 // Commencer avec 5 partenaires pour tester
    })

    console.log(`📊 ${partners.length} partenaires à traiter`)

    let totalFixed = 0
    let totalPartnersProcessed = 0

    for (const partner of partners) {
      console.log(`\n🔍 Traitement de ${partner.companyName}...`)
      
      if (!partner.images || partner.images.length === 0) {
        console.log('  ⏭️  Aucune image, ignoré')
        continue
      }

      // Extraire le chemin du partenaire depuis la première URL
      const firstUrl = partner.images[0]
      const urlParts = firstUrl.split('/')
      const partnerPath = urlParts.slice(0, -1).join('/') // Tout sauf le nom du fichier
      
      console.log(`  📁 Chemin partenaire: ${partnerPath}`)

      try {
        // Lister tous les blobs pour ce partenaire
        const { blobs } = await list({
          prefix: `partners/${partner.id}/960/`,
          limit: 100
        })

        console.log(`  📸 ${blobs.length} images trouvées dans Vercel Blob`)

        if (blobs.length > 0) {
          // Trier les images par nom pour avoir un ordre cohérent
          const sortedBlobs = blobs.sort((a, b) => a.pathname.localeCompare(b.pathname))
          
          // Extraire les URLs des blobs
          const correctUrls = sortedBlobs.map(blob => blob.url)
          
          console.log(`  🔧 Mise à jour de ${correctUrls.length} URLs dans MongoDB`)
          
          // Mettre à jour la base de données
          await prisma.partner.update({
            where: { id: partner.id },
            data: { images: correctUrls }
          })

          console.log(`  ✅ ${correctUrls.length} images mises à jour`)
          totalFixed++
        } else {
          console.log(`  ⚠️  Aucune image trouvée dans Vercel Blob`)
        }

      } catch (error: any) {
        console.log(`  ❌ Erreur lors de la récupération des blobs: ${error.message}`)
      }

      totalPartnersProcessed++

      // Pause entre les partenaires
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n🎉 CORRECTION TERMINÉE !')
    console.log('========================')
    console.log(`📊 Partenaires traités: ${totalPartnersProcessed}`)
    console.log(`🔧 Partenaires corrigés: ${totalFixed}`)

  } catch (error: any) {
    console.error('💥 Erreur lors de la correction:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixImagesFromVercelBlob()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

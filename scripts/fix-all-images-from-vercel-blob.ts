import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function fixAllImagesFromVercelBlob() {
  console.log('🔧 Correction complète des images depuis Vercel Blob...')
  console.log('==================================================')

  try {
    // Récupérer tous les partenaires avec des images qui ont des hash dupliqués
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

    console.log(`📊 ${partners.length} partenaires à traiter`)

    let totalFixed = 0
    let totalPartnersProcessed = 0
    let totalImagesFixed = 0
    let totalErrors = 0

    for (const partner of partners) {
      console.log(`\n🔍 Traitement de ${partner.companyName} (${totalPartnersProcessed + 1}/${partners.length})...`)
      
      if (!partner.images || partner.images.length === 0) {
        console.log('  ⏭️  Aucune image, ignoré')
        totalPartnersProcessed++
        continue
      }

      // Vérifier si toutes les images ont le même hash (partenaires problématiques)
      const hashes = partner.images.map(url => {
        const parts = url.split('/')
        const filename = parts[parts.length - 1]
        const hashPart = filename.split('-').slice(2).join('-').replace('.webp', '')
        return hashPart
      })

      const uniqueHashes = [...new Set(hashes)]
      
      if (uniqueHashes.length === 1) {
        console.log(`  🔍 Hash dupliqué détecté: ${uniqueHashes[0]}`)
        
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
            totalImagesFixed += correctUrls.length
            totalFixed++
          } else {
            console.log(`  ⚠️  Aucune image trouvée dans Vercel Blob`)
          }

        } catch (error: any) {
          console.log(`  ❌ Erreur lors de la récupération des blobs: ${error.message}`)
          totalErrors++
        }
      } else {
        console.log(`  ✅ Hash variés détectés: ${uniqueHashes.length} différents (pas de correction nécessaire)`)
      }

      totalPartnersProcessed++

      // Afficher le progrès tous les 50 partenaires
      if (totalPartnersProcessed % 50 === 0) {
        console.log(`\n📊 PROGRÈS: ${totalPartnersProcessed}/${partners.length} partenaires traités`)
        console.log(`🔧 ${totalFixed} partenaires corrigés`)
        console.log(`🖼️  ${totalImagesFixed} images mises à jour`)
        console.log(`❌ ${totalErrors} erreurs`)
      }

      // Pause entre les partenaires pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log('\n🎉 CORRECTION COMPLÈTE TERMINÉE !')
    console.log('==================================')
    console.log(`📊 Partenaires traités: ${totalPartnersProcessed}`)
    console.log(`🔧 Partenaires corrigés: ${totalFixed}`)
    console.log(`🖼️  Images mises à jour: ${totalImagesFixed}`)
    console.log(`❌ Erreurs: ${totalErrors}`)

  } catch (error: any) {
    console.error('💥 Erreur lors de la correction:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixAllImagesFromVercelBlob()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function updatePartnerImagesDirectly() {
  console.log('🚀 Mise à jour directe des images dans la collection partners...')
  console.log('==============================================================')
  
  try {
    // Récupérer les partenaires avec des storefronts qui ont des images
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
        images: true, // Images actuelles dans la collection partners
        storefronts: {
          select: {
            id: true,
            images: true
          },
          take: 1
        }
      },
      take: 10 // Commencer par 10 partenaires
    })

    console.log(`📊 ${partners.length} partenaires à traiter`)
    console.log('')

    let updatedCount = 0
    let skippedCount = 0

    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i]
      const storefront = partner.storefronts[0]
      
      console.log(`🔍 [${i+1}/${partners.length}] ${partner.companyName}`)
      console.log(`   Partner ID: ${partner.id}`)
      console.log(`   Images actuelles dans partners: ${partner.images?.length || 0}`)
      console.log(`   Images dans storefront: ${storefront.images.length}`)

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

        // Extraire les URLs des vrais fichiers
        const realImageUrls = blobs.map(blob => blob.url)
        
        console.log(`   🔄 Mise à jour de la collection partners...`)
        
        // Mettre à jour directement la propriété images[] dans la collection partners
        await prisma.partner.update({
          where: { id: partner.id },
          data: { images: realImageUrls }
        })
        
        console.log(`   ✅ Images mises à jour pour ${partner.companyName}`)
        console.log(`   📸 ${realImageUrls.length} images ajoutées`)
        updatedCount++

      } catch (error: any) {
        console.error(`   ❌ Erreur pour ${partner.companyName}:`, error.message)
        skippedCount++
      }

      console.log('')
      
      // Pause entre les requêtes
      if (i < partners.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('📊 RÉSULTATS:')
    console.log('=============')
    console.log(`✅ Mis à jour: ${updatedCount}`)
    console.log(`⏭️  Ignorés: ${skippedCount}`)
    console.log(`📈 Total: ${updatedCount + skippedCount}`)

  } catch (error) {
    console.error('💥 Erreur fatale:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Déconnexion de la base de données')
  }
}

if (require.main === module) {
  updatePartnerImagesDirectly()
    .then(() => {
      console.log('🎉 Script terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur:', error)
      process.exit(1)
    })
}

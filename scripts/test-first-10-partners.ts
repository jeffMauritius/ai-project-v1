import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function testFirst10Partners() {
  console.log('🧪 Test des 10 premiers prestataires...')
  console.log('=======================================')
  
  try {
    // Récupérer les 10 premiers partenaires
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        images: true, // Images actuelles dans partners
        storefronts: {
          select: {
            id: true,
            images: true
          },
          take: 1
        }
      },
      take: 10
    })

    console.log(`📊 ${partners.length} partenaires récupérés`)
    console.log('')

    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i]
      const storefront = partner.storefronts?.[0]
      
      console.log(`🔍 [${i+1}/10] ${partner.companyName}`)
      console.log(`   ID: ${partner.id}`)
      console.log(`   Service: ${partner.serviceType}`)
      console.log(`   Images dans partners: ${partner.images?.length || 0}`)
      console.log(`   Images dans storefront: ${storefront?.images?.length || 0}`)

      try {
        // Vérifier les fichiers sur Vercel Blob
        console.log(`   📡 Vérification Vercel Blob...`)
        const { blobs } = await list({ 
          prefix: `partners/${partner.id}/960/`,
          limit: 10 
        })

        if (blobs.length > 0) {
          console.log(`   📁 ${blobs.length} fichiers trouvés sur Vercel`)
          console.log(`   🖼️  Première image: ${blobs[0].url}`)
          
          // Tester l'URL
          try {
            const response = await fetch(blobs[0].url, { method: 'HEAD' })
            console.log(`   ✅ Status: ${response.status} ${response.status === 200 ? 'OK' : 'ERREUR'}`)
            
            if (response.status === 200) {
              console.log(`   🎉 Image accessible !`)
              
              // Mettre à jour la collection partners
              const imageUrls = blobs.map(blob => blob.url)
              await prisma.partner.update({
                where: { id: partner.id },
                data: { images: imageUrls }
              })
              console.log(`   💾 Mis à jour en base !`)
            }
          } catch (fetchError: any) {
            console.log(`   ❌ Erreur test: ${fetchError.message}`)
          }
        } else {
          console.log(`   ⚠️  Aucun fichier trouvé sur Vercel`)
        }

      } catch (error: any) {
        console.log(`   ❌ Erreur Vercel: ${error.message}`)
      }

      console.log('')
      
      // Pause entre les requêtes
      if (i < partners.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('🎉 Test terminé !')

  } catch (error) {
    console.error('💥 Erreur:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Déconnexion')
  }
}

if (require.main === module) {
  testFirst10Partners()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

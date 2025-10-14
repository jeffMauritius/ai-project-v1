import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUrlsWithLogs() {
  console.log('🚀 Début de la correction des URLs...')
  console.log('=====================================')
  
  try {
    console.log('📡 Connexion à la base de données...')
    
    // Récupérer seulement 3 partenaires pour commencer
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
      take: 3
    })

    console.log(`📊 ${partners.length} partenaires trouvés`)
    console.log('')

    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i]
      const storefront = partner.storefronts[0]
      
      console.log(`🔍 [${i+1}/${partners.length}] ${partner.companyName}`)
      console.log(`   Partner ID: ${partner.id}`)
      console.log(`   Storefront ID: ${storefront.id}`)
      console.log(`   Images actuelles: ${storefront.images.length}`)
      
      if (storefront.images.length > 0) {
        console.log(`   Première URL: ${storefront.images[0]}`)
        
        // Corriger la première URL comme exemple
        const originalUrl = storefront.images[0]
        let correctedUrl = originalUrl
        
        // Remplacer l'ID du storefront par l'ID du partner
        correctedUrl = correctedUrl.replace(
          `/partners/${storefront.id}/`,
          `/partners/${partner.id}/`
        )
        
        console.log(`   URL corrigée: ${correctedUrl}`)
        
        // Mettre à jour seulement la première image pour tester
        const correctedImages = [...storefront.images]
        correctedImages[0] = correctedUrl
        
        console.log(`   💾 Mise à jour en base...`)
        
        await prisma.partnerStorefront.update({
          where: { id: storefront.id },
          data: { images: correctedImages }
        })
        
        console.log(`   ✅ Mis à jour !`)
      }
      
      console.log('')
    }

    console.log('🎉 Correction terminée !')

  } catch (error) {
    console.error('💥 Erreur:', error)
  } finally {
    console.log('🔌 Déconnexion de la base de données...')
    await prisma.$disconnect()
    console.log('✅ Terminé !')
  }
}

if (require.main === module) {
  fixUrlsWithLogs()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updatePartnerImageUrls() {
  console.log('🔄 Mise à jour des URLs partenaires vers 960p...')
  
  try {
    // Récupérer seulement les storefronts partenaires avec des images
    const storefronts = await prisma.partnerStorefront.findMany({
      where: {
        partnerId: { not: null }, // Seulement les partenaires (pas les venues)
        images: { isEmpty: false }
      },
      include: {
        partner: true
      },
      // take: 10 // TEST: Limiter à 10 pour commencer
    })
    
    console.log(`📊 ${storefronts.length} storefronts partenaires trouvés`)
    
    let updatedCount = 0
    
    for (let i = 0; i < storefronts.length; i++) {
      const storefront = storefronts[i]
      
      // Déterminer le nom du partenaire
      const entityName = storefront.partner?.companyName
      
      console.log(`📁 [${i + 1}/${storefronts.length}] Traitement de: ${entityName} (partenaire) (${storefront.id})`)
      
      let hasUpdates = false
      const updatedImages: string[] = []
      
      // 1. Mettre à jour les images pour pointer vers le dossier /960/
      for (const imageUrl of storefront.images) {
        if (imageUrl.includes('vercel-storage.com') && imageUrl.includes(`/partners/${storefront.id}/`) && !imageUrl.includes('/960/')) {
          // Ajouter /960/ dans le chemin
          const newUrl = imageUrl.replace(`/partners/${storefront.id}/`, `/partners/${storefront.id}/960/`)
          updatedImages.push(newUrl)
          hasUpdates = true
          console.log(`  🔄 Image transformée: ${imageUrl} -> ${newUrl}`)
        } else {
          updatedImages.push(imageUrl)
        }
      }
      
      // 3. Mettre à jour en base si nécessaire
      if (hasUpdates) {
        await prisma.partnerStorefront.update({
          where: { id: storefront.id },
          data: {
            images: updatedImages
          }
        })
        updatedCount++
        console.log(`  ✅ ${updatedImages.length} URLs mises à jour pour ${entityName}.`)
      } else {
        console.log(`  ✅ Aucune mise à jour nécessaire pour ${entityName}.`)
      }
      
      // Afficher le progrès tous les 100 éléments
      if ((i + 1) % 100 === 0) {
        const progressPercent = ((i + 1) / storefronts.length * 100).toFixed(1)
        console.log(`  📊 Progrès: ${i + 1}/${storefronts.length} storefronts (${progressPercent}%)`)
      }
    }
    
    console.log(`\n🎉 Mise à jour terminée !`)
    console.log(`📊 ${updatedCount} storefronts mis à jour`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
updatePartnerImageUrls()

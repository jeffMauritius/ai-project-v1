import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function updateAllPartnerImages() {
  console.log('🚀 Mise à jour de TOUS les prestataires...')
  console.log('==========================================')
  
  try {
    // Récupérer TOUS les partenaires avec des storefronts qui ont des images
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
        serviceType: true,
        images: true,
        storefronts: {
          select: {
            id: true,
            images: true
          },
          take: 1
        }
      }
    })

    console.log(`📊 ${partners.length} partenaires à traiter`)
    console.log('')

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const startTime = new Date()

    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i]
      const storefront = partner.storefronts[0]
      
      console.log(`🔍 [${i+1}/${partners.length}] ${partner.companyName}`)
      console.log(`   ID: ${partner.id}`)
      console.log(`   Service: ${partner.serviceType}`)
      console.log(`   Images actuelles: ${partner.images?.length || 0}`)

      try {
        // Vérifier les fichiers sur Vercel Blob
        const { blobs } = await list({ 
          prefix: `partners/${partner.id}/960/`,
          limit: 20 
        })

        if (blobs.length > 0) {
          console.log(`   📁 ${blobs.length} fichiers trouvés sur Vercel`)
          
          // Tester la première image
          try {
            const response = await fetch(blobs[0].url, { method: 'HEAD' })
            if (response.status === 200) {
              console.log(`   ✅ Images accessibles`)
              
              // Mettre à jour la collection partners
              const imageUrls = blobs.map(blob => blob.url)
              await prisma.partner.update({
                where: { id: partner.id },
                data: { images: imageUrls }
              })
              console.log(`   💾 Mis à jour !`)
              updatedCount++
            } else {
              console.log(`   ❌ Images non accessibles (${response.status})`)
              skippedCount++
            }
          } catch (fetchError: any) {
            console.log(`   ❌ Erreur test: ${fetchError.message}`)
            skippedCount++
          }
        } else {
          console.log(`   ⚠️  Aucun fichier trouvé sur Vercel`)
          skippedCount++
        }

      } catch (error: any) {
        console.error(`   ❌ Erreur pour ${partner.companyName}:`, error.message)
        errorCount++
      }

      // Rapport de progrès tous les 50 partenaires
      if ((i + 1) % 50 === 0) {
        const elapsed = new Date().getTime() - startTime.getTime()
        const elapsedMinutes = Math.floor(elapsed / 60000)
        const elapsedSeconds = Math.floor((elapsed % 60000) / 1000)
        const rate = (i + 1) / (elapsed / 1000)
        const estimatedTotalTime = partners.length / rate
        const remainingTime = estimatedTotalTime - (elapsed / 1000)
        const remainingMinutes = Math.floor(remainingTime / 60)
        const remainingSeconds = Math.floor(remainingTime % 60)
        
        console.log('')
        console.log('📈 ========== RAPPORT DE PROGRÈS ==========')
        console.log(`⏱️  Temps écoulé: ${elapsedMinutes}m ${elapsedSeconds}s`)
        console.log(`📊 Progrès: ${i + 1}/${partners.length} (${(((i + 1)/partners.length)*100).toFixed(1)}%)`)
        console.log(`✅ Mis à jour: ${updatedCount}`)
        console.log(`⏭️  Ignorés: ${skippedCount}`)
        console.log(`❌ Erreurs: ${errorCount}`)
        console.log(`🚀 Vitesse: ${rate.toFixed(2)} partenaires/seconde`)
        console.log(`⏳ Temps restant: ${remainingMinutes}m ${remainingSeconds}s`)
        console.log('==========================================')
        console.log('')
      }
      
      // Pause entre les requêtes pour éviter les limites de taux
      if (i < partners.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 seconde
      }
    }

    const endTime = new Date()
    const totalTime = endTime.getTime() - startTime.getTime()
    const totalMinutes = Math.floor(totalTime / 60000)
    const totalSeconds = Math.floor((totalTime % 60000) / 1000)

    console.log('')
    console.log('🎉 ========== TRAITEMENT TERMINÉ ==========')
    console.log(`⏰ Début: ${startTime.toLocaleString()}`)
    console.log(`⏰ Fin: ${endTime.toLocaleString()}`)
    console.log(`⏱️  Durée totale: ${totalMinutes}m ${totalSeconds}s`)
    console.log(`📊 Résultats:`)
    console.log(`   • Total traités: ${partners.length}`)
    console.log(`   • Mis à jour: ${updatedCount}`)
    console.log(`   • Ignorés: ${skippedCount}`)
    console.log(`   • Erreurs: ${errorCount}`)
    console.log(`📈 Taux de succès: ${((updatedCount/partners.length)*100).toFixed(1)}%`)
    console.log(`🚀 Vitesse moyenne: ${(partners.length/(totalTime/1000)).toFixed(2)} partenaires/seconde`)
    console.log('==========================================')

  } catch (error) {
    console.error('💥 Erreur fatale:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Déconnexion de la base de données')
  }
}

if (require.main === module) {
  updateAllPartnerImages()
    .then(() => {
      console.log('🎉 Script terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur:', error)
      process.exit(1)
    })
}

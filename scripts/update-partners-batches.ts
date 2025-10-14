import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function updatePartnersInBatches() {
  console.log('🚀 Mise à jour des partenaires par lots...')
  console.log('==========================================')
  
  try {
    // D'abord compter le total
    const totalPartners = await prisma.partner.count({
      where: {
        storefronts: {
          some: {
            images: { isEmpty: false }
          }
        }
      }
    })

    console.log(`📊 ${totalPartners} partenaires à traiter au total`)
    console.log('')

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const startTime = new Date()
    const BATCH_SIZE = 100 // Traiter par lots de 100

    let offset = 0
    let processedCount = 0

    while (processedCount < totalPartners) {
      console.log(`📦 Traitement du lot ${Math.floor(offset / BATCH_SIZE) + 1} (${offset + 1} à ${Math.min(offset + BATCH_SIZE, totalPartners)})`)
      
      // Récupérer un lot de partenaires
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
        },
        skip: offset,
        take: BATCH_SIZE
      })

      if (partners.length === 0) {
        console.log('✅ Tous les partenaires ont été traités')
        break
      }

      console.log(`   📊 ${partners.length} partenaires dans ce lot`)

      // Traiter chaque partenaire du lot
      for (let i = 0; i < partners.length; i++) {
        const partner = partners[i]
        const storefront = partner.storefronts[0]
        
        console.log(`   🔍 [${processedCount + i + 1}/${totalPartners}] ${partner.companyName}`)

        try {
          // Vérifier les fichiers sur Vercel Blob
          const { blobs } = await list({ 
            prefix: `partners/${partner.id}/960/`,
            limit: 20 
          })

          if (blobs.length > 0) {
            // Tester la première image
            try {
              const response = await fetch(blobs[0].url, { method: 'HEAD' })
              if (response.status === 200) {
                // Mettre à jour la collection partners
                const imageUrls = blobs.map(blob => blob.url)
                await prisma.partner.update({
                  where: { id: partner.id },
                  data: { images: imageUrls }
                })
                console.log(`     ✅ Mis à jour (${blobs.length} images)`)
                updatedCount++
              } else {
                console.log(`     ❌ Images non accessibles (${response.status})`)
                skippedCount++
              }
            } catch (fetchError: any) {
              console.log(`     ❌ Erreur test: ${fetchError.message}`)
              skippedCount++
            }
          } else {
            console.log(`     ⚠️  Aucun fichier trouvé`)
            skippedCount++
          }

        } catch (error: any) {
          console.error(`     ❌ Erreur: ${error.message}`)
          errorCount++
        }

        // Pause entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 500)) // 0.5 seconde
      }

      processedCount += partners.length
      offset += BATCH_SIZE

      // Rapport de progrès
      const elapsed = new Date().getTime() - startTime.getTime()
      const elapsedMinutes = Math.floor(elapsed / 60000)
      const elapsedSeconds = Math.floor((elapsed % 60000) / 1000)
      const rate = processedCount / (elapsed / 1000)
      const estimatedTotalTime = totalPartners / rate
      const remainingTime = estimatedTotalTime - (elapsed / 1000)
      const remainingMinutes = Math.floor(remainingTime / 60)
      const remainingSeconds = Math.floor(remainingTime % 60)
      
      console.log('')
      console.log('📈 ========== RAPPORT DE PROGRÈS ==========')
      console.log(`⏱️  Temps écoulé: ${elapsedMinutes}m ${elapsedSeconds}s`)
      console.log(`📊 Progrès: ${processedCount}/${totalPartners} (${((processedCount/totalPartners)*100).toFixed(1)}%)`)
      console.log(`✅ Mis à jour: ${updatedCount}`)
      console.log(`⏭️  Ignorés: ${skippedCount}`)
      console.log(`❌ Erreurs: ${errorCount}`)
      console.log(`🚀 Vitesse: ${rate.toFixed(2)} partenaires/seconde`)
      console.log(`⏳ Temps restant: ${remainingMinutes}m ${remainingSeconds}s`)
      console.log('==========================================')
      console.log('')

      // Pause entre les lots
      if (processedCount < totalPartners) {
        console.log('⏳ Pause de 2 secondes avant le prochain lot...')
        await new Promise(resolve => setTimeout(resolve, 2000))
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
    console.log(`   • Total traités: ${processedCount}`)
    console.log(`   • Mis à jour: ${updatedCount}`)
    console.log(`   • Ignorés: ${skippedCount}`)
    console.log(`   • Erreurs: ${errorCount}`)
    console.log(`📈 Taux de succès: ${((updatedCount/processedCount)*100).toFixed(1)}%`)
    console.log(`🚀 Vitesse moyenne: ${(processedCount/(totalTime/1000)).toFixed(2)} partenaires/seconde`)
    console.log('==========================================')

  } catch (error) {
    console.error('💥 Erreur fatale:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Déconnexion de la base de données')
  }
}

if (require.main === module) {
  updatePartnersInBatches()
    .then(() => {
      console.log('🎉 Script terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur:', error)
      process.exit(1)
    })
}

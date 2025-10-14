import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function updatePartnersSimple() {
  console.log('🚀 Mise à jour des partenaires (version simple)...')
  console.log('=================================================')
  
  try {
    let offset = 0
    const BATCH_SIZE = 50 // Petits lots comme le script qui marche
    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0
    let totalProcessed = 0
    const startTime = new Date()

    while (true) {
      console.log(`📦 Lot ${Math.floor(offset / BATCH_SIZE) + 1} (offset: ${offset})`)
      
      // Même requête que le script qui marche, mais avec offset
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
        console.log('✅ Plus de partenaires à traiter')
        break
      }

      console.log(`   📊 ${partners.length} partenaires dans ce lot`)

      // Traiter chaque partenaire (même logique que le script qui marche)
      for (let i = 0; i < partners.length; i++) {
        const partner = partners[i]
        const storefront = partner.storefronts[0]
        
        console.log(`   🔍 [${totalProcessed + i + 1}] ${partner.companyName}`)
        console.log(`       ID: ${partner.id}`)
        console.log(`       Service: ${partner.serviceType}`)
        console.log(`       Images actuelles: ${partner.images?.length || 0}`)

        try {
          // Vérifier les fichiers sur Vercel Blob
          const { blobs } = await list({ 
            prefix: `partners/${partner.id}/960/`,
            limit: 20 
          })

          if (blobs.length > 0) {
            console.log(`       📁 ${blobs.length} fichiers trouvés sur Vercel`)
            
            // Tester la première image
            try {
              const response = await fetch(blobs[0].url, { method: 'HEAD' })
              if (response.status === 200) {
                console.log(`       ✅ Images accessibles`)
                
                // Mettre à jour la collection partners
                const imageUrls = blobs.map(blob => blob.url)
                await prisma.partner.update({
                  where: { id: partner.id },
                  data: { images: imageUrls }
                })
                console.log(`       💾 Mis à jour !`)
                updatedCount++
              } else {
                console.log(`       ❌ Images non accessibles (${response.status})`)
                skippedCount++
              }
            } catch (fetchError: any) {
              console.log(`       ❌ Erreur test: ${fetchError.message}`)
              skippedCount++
            }
          } else {
            console.log(`       ⚠️  Aucun fichier trouvé sur Vercel`)
            skippedCount++
          }

        } catch (error: any) {
          console.error(`       ❌ Erreur pour ${partner.companyName}:`, error.message)
          errorCount++
        }

        console.log('')
        
        // Pause entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      totalProcessed += partners.length
      offset += BATCH_SIZE

      // Rapport de progrès
      const elapsed = new Date().getTime() - startTime.getTime()
      const elapsedMinutes = Math.floor(elapsed / 60000)
      const elapsedSeconds = Math.floor((elapsed % 60000) / 1000)
      
      console.log('📈 ========== RAPPORT DE PROGRÈS ==========')
      console.log(`⏱️  Temps écoulé: ${elapsedMinutes}m ${elapsedSeconds}s`)
      console.log(`📊 Total traités: ${totalProcessed}`)
      console.log(`✅ Mis à jour: ${updatedCount}`)
      console.log(`⏭️  Ignorés: ${skippedCount}`)
      console.log(`❌ Erreurs: ${errorCount}`)
      console.log('==========================================')
      console.log('')

      // Pause entre les lots
      console.log('⏳ Pause de 3 secondes avant le prochain lot...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    const endTime = new Date()
    const totalTime = endTime.getTime() - startTime.getTime()
    const totalMinutes = Math.floor(totalTime / 60000)
    const totalSeconds = Math.floor((totalTime % 60000) / 1000)

    console.log('')
    console.log('🎉 ========== TRAITEMENT TERMINÉ ==========')
    console.log(`⏰ Durée totale: ${totalMinutes}m ${totalSeconds}s`)
    console.log(`📊 Résultats:`)
    console.log(`   • Total traités: ${totalProcessed}`)
    console.log(`   • Mis à jour: ${updatedCount}`)
    console.log(`   • Ignorés: ${skippedCount}`)
    console.log(`   • Erreurs: ${errorCount}`)
    console.log(`📈 Taux de succès: ${((updatedCount/totalProcessed)*100).toFixed(1)}%`)
    console.log('==========================================')

  } catch (error) {
    console.error('💥 Erreur fatale:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Déconnexion de la base de données')
  }
}

if (require.main === module) {
  updatePartnersSimple()
    .then(() => {
      console.log('🎉 Script terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur:', error)
      process.exit(1)
    })
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function monitorProgress() {
  console.log('📊 Monitoring des processus en cours...\n')
  
  try {
    // Vérifier le statut des images des établissements
    const establishmentsWithImages = await prisma.establishment.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: { id: true, name: true, images: true }
    })
    
    let mariagesNetCount = 0
    let vercelBlobCount = 0
    
    for (const establishment of establishmentsWithImages) {
      for (const imageUrl of establishment.images) {
        if (imageUrl.includes('mariages.net')) {
          mariagesNetCount++
        } else if (imageUrl.includes('vercel-storage.com') || imageUrl.includes('blob.vercel-storage.com')) {
          vercelBlobCount++
        }
      }
    }
    
    // Vérifier le statut des images des partenaires
    const partnersWithImages = await prisma.partner.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: { id: true, companyName: true, images: true }
    })
    
    let partnerMariagesNetCount = 0
    let partnerVercelBlobCount = 0
    
    for (const partner of partnersWithImages) {
      for (const imageUrl of partner.images) {
        if (imageUrl.includes('mariages.net')) {
          partnerMariagesNetCount++
        } else if (imageUrl.includes('vercel-storage.com') || imageUrl.includes('blob.vercel-storage.com')) {
          partnerVercelBlobCount++
        }
      }
    }
    
    console.log('📈 PROGRÈS DES UPLOADS')
    console.log('==================================================')
    console.log('🏛️  ÉTABLISSEMENTS:')
    console.log(`  - Images restantes (mariages.net): ${mariagesNetCount}`)
    console.log(`  - Images uploadées (Vercel Blob): ${vercelBlobCount}`)
    console.log(`  - Progression: ${((vercelBlobCount / (mariagesNetCount + vercelBlobCount)) * 100).toFixed(2)}%`)
    
    console.log('\n🤝 PARTENAIRES:')
    console.log(`  - Images restantes (mariages.net): ${partnerMariagesNetCount}`)
    console.log(`  - Images uploadées (Vercel Blob): ${partnerVercelBlobCount}`)
    console.log(`  - Progression: ${partnerMariagesNetCount + partnerVercelBlobCount > 0 ? ((partnerVercelBlobCount / (partnerMariagesNetCount + partnerVercelBlobCount)) * 100).toFixed(2) : 0}%`)
    
    console.log('\n📊 TOTAL GLOBAL:')
    const totalRemaining = mariagesNetCount + partnerMariagesNetCount
    const totalUploaded = vercelBlobCount + partnerVercelBlobCount
    const totalImages = totalRemaining + totalUploaded
    console.log(`  - Images restantes: ${totalRemaining}`)
    console.log(`  - Images uploadées: ${totalUploaded}`)
    console.log(`  - Progression globale: ${totalImages > 0 ? ((totalUploaded / totalImages) * 100).toFixed(2) : 0}%`)
    
    if (totalRemaining === 0) {
      console.log('\n🎉 Tous les uploads sont terminés !')
    } else {
      console.log('\n⏳ Uploads en cours...')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du monitoring:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  monitorProgress()
    .then(() => {
      console.log('\n✅ Monitoring terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { monitorProgress }





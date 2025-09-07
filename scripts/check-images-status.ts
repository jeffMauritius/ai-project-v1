import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkImagesStatus() {
  console.log('🖼️  Vérification du statut des images...\n')
  
  try {
    // Vérifier les images d'établissements
    const establishmentsWithImages = await prisma.establishment.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        name: true,
        images: true
      }
    })

    const totalEstablishmentImages = establishmentsWithImages.reduce(
      (total, est) => total + est.images.length, 0
    )

    // Vérifier les images de partenaires (médias via storefronts)
    const partnersWithMedia = await prisma.partner.findMany({
      include: {
        storefronts: {
          include: {
            media: true
          }
        }
      }
    })

    const totalPartnerImages = partnersWithMedia.reduce(
      (total, partner) => total + partner.storefronts.reduce(
        (storefrontTotal, storefront) => storefrontTotal + storefront.media.filter(m => m.url).length, 0
      ), 0
    )

    // Analyser les URLs (mariages.net vs Vercel Blob)
    let mariagesNetImages = 0
    let vercelBlobImages = 0
    let otherImages = 0

    // Analyser les établissements
    for (const establishment of establishmentsWithImages) {
      for (const imageUrl of establishment.images) {
        if (imageUrl.includes('mariages.net')) {
          mariagesNetImages++
        } else if (imageUrl.includes('blob.vercel-storage.com')) {
          vercelBlobImages++
        } else {
          otherImages++
        }
      }
    }

    // Analyser les partenaires
    for (const partner of partnersWithMedia) {
      for (const storefront of partner.storefronts) {
        for (const media of storefront.media) {
          if (media.url) {
            if (media.url.includes('mariages.net')) {
              mariagesNetImages++
            } else if (media.url.includes('blob.vercel-storage.com')) {
              vercelBlobImages++
            } else {
              otherImages++
            }
          }
        }
      }
    }

    const totalImages = mariagesNetImages + vercelBlobImages + otherImages

    // Afficher les statistiques
    console.log('📊 STATISTIQUES DES IMAGES')
    console.log('=' .repeat(50))
    console.log(`🏛️  ÉTABLISSEMENTS:`)
    console.log(`  - Établissements avec images: ${establishmentsWithImages.length}`)
    console.log(`  - Total images d'établissements: ${totalEstablishmentImages}`)

    console.log(`\n🤝 PARTENAIRES:`)
    console.log(`  - Partenaires avec médias: ${partnersWithMedia.length}`)
    console.log(`  - Total images de partenaires: ${totalPartnerImages}`)

    console.log(`\n📈 RÉSUMÉ GLOBAL:`)
    console.log(`  - Total images: ${totalImages}`)
    console.log(`  - Images mariages.net: ${mariagesNetImages}`)
    console.log(`  - Images Vercel Blob: ${vercelBlobImages}`)
    console.log(`  - Autres images: ${otherImages}`)

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS')
    console.log('=' .repeat(50))

    if (mariagesNetImages === 0) {
      console.log('✅ Toutes les images sont déjà sur Vercel Blob !')
    } else if (mariagesNetImages < 100) {
      console.log('🟡 Peu d\'images à uploader - processus rapide')
      console.log('   Commande: npm run upload:organized')
    } else if (mariagesNetImages < 1000) {
      console.log('🟠 Nombre modéré d\'images à uploader')
      console.log('   Commande: npm run upload:organized')
      console.log('   ⏱️  Temps estimé: 10-30 minutes')
    } else {
      console.log('🔴 Beaucoup d\'images à uploader')
      console.log('   Commande: npm run upload:organized')
      console.log('   ⏱️  Temps estimé: 1-3 heures')
      console.log('   ⚠️  Le processus peut être interrompu et repris')
    }

    // Exemples d'entités avec images
    if (establishmentsWithImages.length > 0 || partnersWithMedia.length > 0) {
      console.log('\n📋 EXEMPLES D\'ENTITÉS AVEC IMAGES:')
      console.log('=' .repeat(50))

      if (establishmentsWithImages.length > 0) {
        console.log('🏛️  Établissements:')
        establishmentsWithImages.slice(0, 3).forEach((est, i) => {
          console.log(`  ${i + 1}. ${est.name} - ${est.images.length} images`)
          if (est.images.length > 0) {
            console.log(`     Première image: ${est.images[0].substring(0, 80)}...`)
          }
        })
      }

      if (partnersWithMedia.length > 0) {
        console.log('\n🤝 Partenaires:')
        partnersWithMedia.slice(0, 3).forEach((partner, i) => {
          const totalMedia = partner.storefronts.reduce(
            (total, storefront) => total + storefront.media.filter(m => m.url).length, 0
          )
          console.log(`  ${i + 1}. ${partner.companyName} - ${totalMedia} médias`)
          if (totalMedia > 0) {
            const firstMedia = partner.storefronts.find(s => s.media.some(m => m.url))?.media.find(m => m.url)
            if (firstMedia?.url) {
              console.log(`     Premier média: ${firstMedia.url.substring(0, 80)}...`)
            }
          }
        })
      }
    }

    // Structure des dossiers
    console.log('\n📂 STRUCTURE DES DOSSIERS VERCEL BLOB:')
    console.log('=' .repeat(50))
    console.log('📁 establishments/')
    console.log('  📁 [establishment-id]/')
    console.log('    🖼️  image-1.jpg')
    console.log('    🖼️  image-2.jpg')
    console.log('    ...')
    console.log('📁 partners/')
    console.log('  📁 [partner-id]/')
    console.log('    🖼️  image-[media-id].jpg')
    console.log('    🖼️  image-[media-id].png')
    console.log('    ...')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  checkImagesStatus()
    .then(() => {
      console.log('\n✅ Vérification terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { checkImagesStatus }

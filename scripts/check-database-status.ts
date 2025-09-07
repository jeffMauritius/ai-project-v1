import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DatabaseStats {
  users: number
  establishments: number
  partners: number
  storefronts: number
  media: number
  searchHistory: number
  favorites: number
  consultedStorefronts: number
}

async function checkDatabaseStatus() {
  console.log('🔍 Vérification de l\'état de la base de données...\n')
  
  try {
    // Compter tous les éléments
    const stats: DatabaseStats = {
      users: await prisma.user.count(),
      establishments: await prisma.establishment.count(),
      partners: await prisma.partner.count(),
      storefronts: await prisma.partnerStorefront.count(),
      media: await prisma.media.count(),
      searchHistory: await prisma.searchHistory.count(),
      favorites: await prisma.favorite.count(),
      consultedStorefronts: await prisma.consultedStorefront.count()
    }

    // Afficher les statistiques générales
    console.log('📊 STATISTIQUES GÉNÉRALES')
    console.log('=' .repeat(50))
    console.log(`👥 Utilisateurs: ${stats.users}`)
    console.log(`🏛️  Établissements: ${stats.establishments}`)
    console.log(`🤝 Partenaires: ${stats.partners}`)
    console.log(`🏪 Vitrines: ${stats.storefronts}`)
    console.log(`📷 Médias: ${stats.media}`)
    console.log(`🔍 Historique recherches: ${stats.searchHistory}`)
    console.log(`❤️  Favoris: ${stats.favorites}`)
    console.log(`👁️  Vitrines consultées: ${stats.consultedStorefronts}`)

    // Vérifier les données detaillées
    console.log('\n📋 DÉTAILS DES DONNÉES')
    console.log('=' .repeat(50))

    // Vérifier les utilisateurs par rôle
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    })
    
    console.log('\n👥 UTILISATEURS PAR RÔLE:')
    usersByRole.forEach(group => {
      console.log(`  - ${group.role}: ${group._count.id}`)
    })

    // Vérifier les partenaires par type de service
    const partnersByService = await prisma.partner.groupBy({
      by: ['serviceType'],
      _count: { id: true }
    })
    
    console.log('\n🤝 PARTENAIRES PAR TYPE DE SERVICE:')
    partnersByService.forEach(group => {
      console.log(`  - ${group.serviceType}: ${group._count.id}`)
    })

    // Vérifier les vitrines par type
    const storefrontsByType = await prisma.partnerStorefront.groupBy({
      by: ['type'],
      _count: { id: true }
    })
    
    console.log('\n🏪 VITRINES PAR TYPE:')
    storefrontsByType.forEach(group => {
      console.log(`  - ${group.type}: ${group._count.id}`)
    })

    // Vérifier les établissements par région
    const establishmentsByRegion = await prisma.establishment.groupBy({
      by: ['region'],
      _count: { id: true }
    })
    
    console.log('\n🏛️  ÉTABLISSEMENTS PAR RÉGION (top 10):')
    establishmentsByRegion
      .sort((a, b) => b._count.id - a._count.id)
      .slice(0, 10)
      .forEach(group => {
        console.log(`  - ${group.region}: ${group._count.id}`)
      })

    // Vérifier l'intégrité des données
    console.log('\n🔧 VÉRIFICATION D\'INTÉGRITÉ')
    console.log('=' .repeat(50))

    // Vitrines sans établissement ou partenaire (approximatif)
    console.log(`📊 Vitrines totales: ${stats.storefronts}`)
    console.log(`📊 Établissements: ${stats.establishments}`)  
    console.log(`📊 Partenaires: ${stats.partners}`)
    
    // Vérification simple de cohérence
    const expectedStorefronts = stats.establishments + stats.partners
    if (stats.storefronts < expectedStorefronts) {
      console.log(`⚠️  Possible incohérence: ${expectedStorefronts - stats.storefronts} vitrines manquantes`)
    } else if (stats.storefronts > expectedStorefronts) {
      console.log(`⚠️  Possible incohérence: ${stats.storefronts - expectedStorefronts} vitrines en trop`)
    } else {
      console.log(`✅ Cohérence vitrines/entités OK`)
    }

    // Vérifier les images uploadées vs locales
    console.log('\n📷 ANALYSE DES IMAGES')
    console.log('=' .repeat(50))

    const establishmentsWithImages = await prisma.establishment.findMany({
      select: { images: true }
    })
    
    let localImages = 0
    let uploadedImages = 0
    
    establishmentsWithImages.forEach(est => {
      if (est.images) {
        est.images.forEach(img => {
          if (img.includes('vercel-storage.com') || img.includes('blob.vercel-storage.com')) {
            uploadedImages++
          } else {
            localImages++
          }
        })
      }
    })

    const mediaUrls = await prisma.media.findMany({
      select: { url: true }
    })
    
    mediaUrls.forEach(media => {
      if (media.url.includes('vercel-storage.com') || media.url.includes('blob.vercel-storage.com')) {
        uploadedImages++
      } else {
        localImages++
      }
    })

    console.log(`📤 Images uploadées sur Vercel: ${uploadedImages}`)
    console.log(`💻 Images locales/externes: ${localImages}`)
    console.log(`📊 Total images: ${uploadedImages + localImages}`)

    if (uploadedImages > 0) {
      console.log(`✅ ${((uploadedImages / (uploadedImages + localImages)) * 100).toFixed(1)}% des images sont uploadées`)
    }

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS')
    console.log('=' .repeat(50))

    if (stats.users === 0 && stats.establishments === 0 && stats.partners === 0) {
      console.log('🚀 Base de données vide - vous pouvez lancer une migration complète')
    } else if (localImages > uploadedImages) {
      console.log('📤 Beaucoup d\'images non uploadées - lancer l\'upload d\'images')
    } else {
      console.log('✅ Base de données en bon état - migration sécurisée recommandée')
    }

    console.log('\n🎯 PROCHAINES ÉTAPES RECOMMANDÉES:')
    if (stats.establishments > 0 || stats.partners > 0) {
      console.log('  1. Utiliser le script de migration sécurisée: npm run migration:safe')
      console.log('  2. Lancer l\'upload d\'images si nécessaire: npm run migration:upload-images')
    } else {
      console.log('  1. Lancer la migration complète: npm run migration:full')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  checkDatabaseStatus()
    .then(() => {
      console.log('\n✅ Vérification terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { checkDatabaseStatus }

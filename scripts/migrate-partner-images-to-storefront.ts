import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateImagesToTables() {
  console.log('🔄 Migration des images vers les tables séparées...')
  
  try {
    // 1. MIGRATION DES PARTENAIRES VERS STOREFRONTS
    console.log('\n🤝 === MIGRATION DES PARTENAIRES ===')
    const partnersWithImages = await prisma.partner.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      include: {
        storefronts: true
      }
    })

    console.log(`📊 ${partnersWithImages.length} partenaires avec images trouvés`)

    let partnersMigrated = 0
    let partnersSkipped = 0

    for (const partner of partnersWithImages) {
      console.log(`\n📁 Partenaire: ${partner.companyName} (${partner.images.length} images)`)
      
      // Vérifier si le partenaire a des storefronts
      if (partner.storefronts.length === 0) {
        console.log(`  ⏭️  Aucun storefront, ignoré`)
        partnersSkipped += partner.images.length
        continue
      }

      // Utiliser le premier storefront
      const storefront = partner.storefronts[0]
      console.log(`  🏪 Storefront: ${storefront.id} (${storefront.type})`)

      // Vérifier si des médias existent déjà
      const existingMedia = await prisma.media.findMany({
        where: { storefrontId: storefront.id }
      })

      if (existingMedia.length > 0) {
        console.log(`  ⏭️  ${existingMedia.length} médias existants, ignoré`)
        partnersSkipped += partner.images.length
        continue
      }

      // Créer les entrées Media pour chaque image
      const mediaEntries = partner.images.map((imageUrl, index) => ({
        storefrontId: storefront.id,
        url: imageUrl,
        type: 'IMAGE' as const,
        title: `Image ${index + 1}`,
        description: `Image ${index + 1} de ${partner.companyName}`,
        order: index + 1
      }))

      // Insérer les médias
      await prisma.media.createMany({
        data: mediaEntries
      })

      console.log(`  ✅ ${mediaEntries.length} médias créés`)
      partnersMigrated += mediaEntries.length
    }

    // 2. MIGRATION DES ÉTABLISSEMENTS VERS TABLE IMAGE
    console.log('\n🏛️ === MIGRATION DES ÉTABLISSEMENTS ===')
    const establishmentsWithImages = await prisma.establishment.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      include: {
        Images: true
      }
    })

    console.log(`📊 ${establishmentsWithImages.length} établissements avec images trouvés`)

    let establishmentsMigrated = 0
    let establishmentsSkipped = 0

    for (const establishment of establishmentsWithImages) {
      console.log(`\n📁 Établissement: ${establishment.name} (${establishment.images.length} images)`)
      
      // Vérifier si des images existent déjà dans la table Image
      if (establishment.Images.length > 0) {
        console.log(`  ⏭️  ${establishment.Images.length} images existantes, ignoré`)
        establishmentsSkipped += establishment.images.length
        continue
      }

      // Créer les entrées Image pour chaque image
      const imageEntries = establishment.images.map((imageUrl, index) => ({
        establishmentId: establishment.id,
        url: imageUrl,
        order: index + 1
      }))

      // Insérer les images
      await prisma.image.createMany({
        data: imageEntries
      })

      console.log(`  ✅ ${imageEntries.length} images créées`)
      establishmentsMigrated += imageEntries.length
    }

    console.log('\n🎉 Migration terminée !')
    console.log('==================================================')
    console.log(`🤝 PARTENAIRES:`)
    console.log(`  📊 Médias migrés: ${partnersMigrated}`)
    console.log(`  ⏭️  Médias ignorés: ${partnersSkipped}`)
    console.log(`🏛️  ÉTABLISSEMENTS:`)
    console.log(`  📊 Images migrées: ${establishmentsMigrated}`)
    console.log(`  ⏭️  Images ignorées: ${establishmentsSkipped}`)
    console.log(`📊 TOTAL:`)
    console.log(`  📊 Total migré: ${partnersMigrated + establishmentsMigrated}`)
    console.log(`  ⏭️  Total ignoré: ${partnersSkipped + establishmentsSkipped}`)

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
migrateImagesToTables().catch(console.error)

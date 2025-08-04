import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanStorefronts() {
  try {
    console.log('🧹 Début du nettoyage des vitrines...')

    // Récupérer toutes les vitrines
    const storefronts = await prisma.partnerStorefront.findMany()
    console.log(`📊 ${storefronts.length} vitrines trouvées`)

    let deletedCount = 0
    let errorCount = 0

    for (const storefront of storefronts) {
      try {
        console.log(`\n🗑️  Suppression de la vitrine: ${storefront.companyName}`)

        // Supprimer les médias associés
        await prisma.media.deleteMany({
          where: {
            storefrontId: storefront.id
          }
        })

        // Supprimer les espaces de réception
        await prisma.receptionSpace.deleteMany({
          where: {
            storefrontId: storefront.id
          }
        })

        // Supprimer les options de réception
        await prisma.receptionOptions.deleteMany({
          where: {
            storefrontId: storefront.id
          }
        })

        // Supprimer la vitrine (cela supprimera automatiquement l'utilisateur via la relation)
        await prisma.partnerStorefront.delete({
          where: {
            id: storefront.id
          }
        })

        deletedCount++
        console.log(`✅ Vitrine supprimée avec succès: ${storefront.companyName}`)

      } catch (error) {
        errorCount++
        console.error(`❌ Erreur lors de la suppression de ${storefront.companyName}:`, error)
      }
    }

    console.log(`\n🎉 Nettoyage terminé !`)
    console.log(`✅ ${deletedCount} vitrines supprimées avec succès`)
    console.log(`❌ ${errorCount} erreurs rencontrées`)

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le nettoyage
cleanStorefronts() 
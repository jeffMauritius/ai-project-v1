import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanTempUsers() {
  try {
    console.log('🧹 Début du nettoyage des utilisateurs temp...')

    // Récupérer tous les utilisateurs avec @temp.com
    const tempUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: '@temp.com'
        }
      }
    })

    console.log(`📊 ${tempUsers.length} utilisateurs temp trouvés`)

    let deletedCount = 0
    let errorCount = 0

    for (const user of tempUsers) {
      try {
        console.log(`\n🗑️  Suppression de l'utilisateur: ${user.email}`)

        // Supprimer l'utilisateur (cela supprimera automatiquement la vitrine associée)
        await prisma.user.delete({
          where: {
            id: user.id
          }
        })

        deletedCount++
        console.log(`✅ Utilisateur supprimé avec succès: ${user.email}`)

      } catch (error) {
        errorCount++
        console.error(`❌ Erreur lors de la suppression de ${user.email}:`, error)
      }
    }

    console.log(`\n🎉 Nettoyage terminé !`)
    console.log(`✅ ${deletedCount} utilisateurs supprimés avec succès`)
    console.log(`❌ ${errorCount} erreurs rencontrées`)

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le nettoyage
cleanTempUsers() 
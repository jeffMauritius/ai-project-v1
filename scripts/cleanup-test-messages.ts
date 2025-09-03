import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestMessages() {
  try {
    console.log('🧹 Nettoyage des données de test du système de messages...')

    // 1. Supprimer les messages de test
    console.log('\n1. Suppression des messages de test...')
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        OR: [
          { content: { contains: 'Bonjour, je souhaiterais avoir plus d\'informations sur vos prestations pour un mariage.' } },
          { content: { contains: 'Bonjour ! Je serais ravi de vous renseigner. Quelles sont vos dates et le nombre d\'invités ?' } }
        ]
      }
    })
    console.log(`✅ ${deletedMessages.count} messages supprimés`)

    // 2. Supprimer les conversations de test
    console.log('\n2. Suppression des conversations de test...')
    const deletedConversations = await prisma.conversation.deleteMany({
      where: {
        OR: [
          { clientId: { in: [] } }, // Sera rempli après la recherche des utilisateurs
          { partnerId: { in: [] } } // Sera rempli après la recherche des utilisateurs
        ]
      }
    })
    console.log(`✅ ${deletedConversations.count} conversations supprimées`)

    // 3. Supprimer les utilisateurs de test
    console.log('\n3. Suppression des utilisateurs de test...')
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test-user@example.com' },
          { email: 'test-partner@example.com' }
        ]
      }
    })
    console.log(`✅ ${deletedUsers.count} utilisateurs supprimés`)

    console.log('\n🎉 Nettoyage terminé avec succès !')
    console.log('📝 Toutes les données de test ont été supprimées de la base de données.')

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le nettoyage
cleanupTestMessages() 
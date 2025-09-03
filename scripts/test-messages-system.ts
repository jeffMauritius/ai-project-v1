import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMessagesSystem() {
  console.log('🧪 Test du système de messages...')
  
  try {
    // Test 1: Vérifier que les tables existent
    console.log('📋 Test 1: Vérification des tables...')
    
    const conversationsCount = await prisma.conversation.count()
    const messagesCount = await prisma.message.count()
    
    console.log(`✅ Conversations: ${conversationsCount}`)
    console.log(`✅ Messages: ${messagesCount}`)
    
    // Test 2: Vérifier la structure des modèles
    console.log('\n📋 Test 2: Structure des modèles...')
    
    // Essayer de créer une conversation de test (sera supprimée)
    const testConversation = await prisma.conversation.create({
      data: {
        clientId: 'test-client-id',
        partnerId: 'test-partner-id',
        storefrontId: 'test-storefront-id',
        lastMessageAt: new Date(),
        unreadCount: 0
      }
    })
    
    console.log('✅ Création de conversation: OK')
    
    // Créer un message de test
    const testMessage = await prisma.message.create({
      data: {
        content: 'Message de test',
        senderId: 'test-client-id',
        conversationId: testConversation.id,
        read: false
      }
    })
    
    console.log('✅ Création de message: OK')
    
    // Nettoyer les données de test
    await prisma.message.delete({
      where: { id: testMessage.id }
    })
    
    await prisma.conversation.delete({
      where: { id: testConversation.id }
    })
    
    console.log('✅ Nettoyage des données de test: OK')
    
    console.log('\n🎉 Tous les tests sont passés avec succès !')
    console.log('🚀 Le système de messages est prêt à être utilisé.')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testMessagesSystem() 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMessageSystem() {
  try {
    console.log('🧪 Test du système de messages...')

    // 1. Créer un utilisateur test (particulier)
    console.log('\n1. Création d\'un utilisateur particulier...')
    const testUser = await prisma.user.upsert({
      where: { email: 'test-user@example.com' },
      update: {},
      create: {
        email: 'test-user@example.com',
        name: 'Test User',
        password: 'testpassword123',
        role: 'USER'
      }
    })
    console.log('✅ Utilisateur particulier créé:', testUser.id)

    // 2. Créer un utilisateur partenaire
    console.log('\n2. Création d\'un utilisateur partenaire...')
    const testPartner = await prisma.user.upsert({
      where: { email: 'test-partner@example.com' },
      update: {},
      create: {
        email: 'test-partner@example.com',
        name: 'Château de Vaux-le-Vicomte',
        password: 'testpassword123',
        role: 'PARTNER'
      }
    })
    console.log('✅ Utilisateur partenaire créé:', testPartner.id)

    // 3. Créer une conversation entre eux
    console.log('\n3. Création d\'une conversation...')
    const conversation = await prisma.conversation.create({
      data: {
        clientId: testUser.id,
        partnerId: testPartner.id,
        lastMessageAt: new Date(),
        unreadCount: 0
      }
    })
    console.log('✅ Conversation créée:', conversation.id)

    // 4. Ajouter des messages de test
    console.log('\n4. Ajout de messages de test...')
    
    // Message du client
    const clientMessage = await prisma.message.create({
      data: {
        content: 'Bonjour, je souhaiterais avoir plus d\'informations sur vos prestations pour un mariage.',
        senderId: testUser.id,
        conversationId: conversation.id,
        read: false
      }
    })
    console.log('✅ Message client créé:', clientMessage.id)

    // Message du partenaire
    const partnerMessage = await prisma.message.create({
      data: {
        content: 'Bonjour ! Je serais ravi de vous renseigner. Quelles sont vos dates et le nombre d\'invités ?',
        senderId: testPartner.id,
        conversationId: conversation.id,
        read: false
      }
    })
    console.log('✅ Message partenaire créé:', partnerMessage.id)

    // 5. Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: 2
      }
    })

    // 6. Vérifier que tout est bien créé
    console.log('\n5. Vérification des données créées...')
    
    const finalConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        client: true,
        partner: true,
        messages: {
          include: {
            sender: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (finalConversation) {
      console.log('✅ Conversation finale:')
      console.log('   - Client:', finalConversation.client.name)
      console.log('   - Partenaire:', finalConversation.partner.name)
      console.log('   - Nombre de messages:', finalConversation.messages.length)
      console.log('   - Messages non lus:', finalConversation.unreadCount)
      
      finalConversation.messages.forEach((msg, index) => {
        console.log(`   - Message ${index + 1}: ${msg.content} (de: ${msg.sender.name})`)
      })
    }

    console.log('\n🎉 Test du système de messages terminé avec succès !')
    console.log('\n📱 Pour tester l\'interface:')
    console.log('   1. Connectez-vous avec test-user@example.com')
    console.log('   2. Allez dans Messages du dashboard')
    console.log('   3. Vous devriez voir la conversation avec "Château de Vaux-le-Vicomte"')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testMessageSystem() 
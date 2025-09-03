import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestConversation() {
  try {
    console.log('🔍 Recherche de l\'utilisateur jr@dev.com...')
    
    // Trouver l'utilisateur jr@dev.com
    const user = await prisma.user.findUnique({
      where: { email: 'jr@dev.com' }
    })

    if (!user) {
      console.log('❌ Utilisateur jr@dev.com non trouvé')
      return
    }

    console.log('✅ Utilisateur trouvé:', user.id)

    // Trouver le partenaire Mona Ilsa
    const partner = await prisma.partner.findFirst({
      where: { 
        OR: [
          { companyName: { contains: 'Mona Ilsa' } },
          { companyName: { contains: 'mona-ilsa' } }
        ]
      }
    })

    if (!partner) {
      console.log('❌ Partenaire Mona Ilsa non trouvé')
      return
    }

    console.log('✅ Partenaire trouvé:', partner.id)

    // Vérifier si une conversation existe déjà
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        clientId: user.id,
        partnerId: partner.userId
      }
    })

    if (existingConversation) {
      console.log('✅ Conversation existante trouvée:', existingConversation.id)
      
      // Ajouter un message de test
      const testMessage = await prisma.message.create({
        data: {
          content: 'Bonjour ! Je suis intéressé par vos services de décoration de mariage.',
          senderId: user.id,
          conversationId: existingConversation.id
        }
      })

      console.log('✅ Message de test ajouté:', testMessage.id)
      
      // Mettre à jour la conversation
      await prisma.conversation.update({
        where: { id: existingConversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 }
        }
      })

      console.log('✅ Conversation mise à jour')
      return
    }

    // Créer une nouvelle conversation
    console.log('🆕 Création d\'une nouvelle conversation...')
    
    const conversation = await prisma.conversation.create({
      data: {
        clientId: user.id,
        partnerId: partner.userId,
        lastMessageAt: new Date(),
        unreadCount: 0
      }
    })

    console.log('✅ Conversation créée:', conversation.id)

    // Ajouter un message de test
    const testMessage = await prisma.message.create({
      data: {
        content: 'Bonjour ! Je suis intéressé par vos services de décoration de mariage.',
        senderId: user.id,
        conversationId: conversation.id
      }
    })

    console.log('✅ Message de test ajouté:', testMessage.id)

    console.log('🎉 Conversation de test créée avec succès !')
    console.log('📱 Vous devriez maintenant voir cette conversation dans votre dashboard')

  } catch (error) {
    console.error('❌ Erreur lors de la création de la conversation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestConversation() 
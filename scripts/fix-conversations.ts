import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixConversations() {
  try {
    console.log('🔧 Correction des conversations...')
    
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

    console.log('✅ Partenaire trouvé:', partner.id, partner.companyName)

    // Supprimer toutes les conversations existantes de cet utilisateur
    console.log('🗑️ Suppression des conversations existantes...')
    
    const existingConversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { clientId: user.id },
          { partnerId: user.id }
        ]
      }
    })

    console.log('📊 Conversations existantes à supprimer:', existingConversations.length)

    for (const conv of existingConversations) {
      // Supprimer d'abord les messages
      await prisma.message.deleteMany({
        where: { conversationId: conv.id }
      })
      
      // Puis supprimer la conversation
      await prisma.conversation.delete({
        where: { id: conv.id }
      })
      
      console.log('🗑️ Conversation supprimée:', conv.id)
    }

    // Créer une nouvelle conversation valide
    console.log('🆕 Création d\'une nouvelle conversation valide...')
    
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

    // Vérifier que tout fonctionne
    console.log('🔍 Vérification finale...')
    
    const finalConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        client: true,
        partner: true,
        messages: true
      }
    })

    if (finalConversation) {
      console.log('✅ Conversation finale valide:')
      console.log('  - Client:', finalConversation.client?.name, finalConversation.client?.email)
      console.log('  - Partner:', finalConversation.partner?.name, finalConversation.partner?.email)
      console.log('  - Messages:', finalConversation.messages.length)
    }

    console.log('🎉 Correction terminée avec succès !')
    console.log('📱 Rafraîchissez votre dashboard pour voir la conversation')

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixConversations() 
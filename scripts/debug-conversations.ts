import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugConversations() {
  try {
    console.log('🔍 Débogage des conversations...')
    
    // Trouver l'utilisateur jr@dev.com
    const user = await prisma.user.findUnique({
      where: { email: 'jr@dev.com' }
    })

    if (!user) {
      console.log('❌ Utilisateur jr@dev.com non trouvé')
      return
    }

    console.log('✅ Utilisateur trouvé:', user.id)

    // Récupérer toutes les conversations de l'utilisateur
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { clientId: user.id },
          { partnerId: user.id }
        ]
      },
      include: {
        client: true,
        partner: true,
        messages: true,
        _count: {
          select: { messages: true }
        }
      }
    })

    console.log('📊 Conversations trouvées:', conversations.length)

    for (const conv of conversations) {
      console.log('\n--- Conversation:', conv.id, '---')
      console.log('Client ID:', conv.clientId)
      console.log('Partner ID:', conv.partnerId)
      console.log('Client:', conv.client ? `${conv.client.name} (${conv.client.email})` : 'NULL')
      console.log('Partner:', conv.partner ? `${conv.partner.name} (${conv.partner.email})` : 'NULL')
      console.log('Messages:', conv._count.messages)
      console.log('Dernier message:', conv.lastMessageAt)
    }

    // Vérifier les utilisateurs référencés
    console.log('\n🔍 Vérification des utilisateurs référencés...')
    
    const allUserIds = new Set<string>()
    conversations.forEach(conv => {
      if (conv.clientId) allUserIds.add(conv.clientId)
      if (conv.partnerId) allUserIds.add(conv.partnerId)
    })

    console.log('IDs d\'utilisateurs référencés:', Array.from(allUserIds))

    for (const userId of Array.from(allUserIds)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      })
      
      if (user) {
        console.log('✅ Utilisateur valide:', userId, user.name, user.email)
      } else {
        console.log('❌ Utilisateur INVALIDE:', userId)
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugConversations() 
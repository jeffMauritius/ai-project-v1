import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkConversations() {
  try {
    console.log('🔍 Vérification des conversations et messages...\n')
    
    // Compter les conversations
    const conversationCount = await prisma.conversation.count()
    console.log(`📊 Total conversations: ${conversationCount}`)
    
    // Compter les messages
    const messageCount = await prisma.message.count()
    console.log(`📊 Total messages: ${messageCount}`)
    
    if (conversationCount > 0) {
      console.log('\n📋 DÉTAILS DES CONVERSATIONS:')
      console.log('=' .repeat(50))
      
      const conversations = await prisma.conversation.findMany({
        orderBy: {
          updatedAt: 'desc'
        }
      })
      
      conversations.forEach((conv, index) => {
        console.log(`\n${index + 1}. Conversation ${conv.id}`)
        console.log(`   - UserId: ${conv.userId}`)
        console.log(`   - StorefrontId: ${conv.storefrontId}`)
        console.log(`   - Participants: ${JSON.stringify(conv.participants)}`)
        console.log(`   - LastMessage: ${JSON.stringify(conv.lastMessage)}`)
        console.log(`   - UnreadCount: ${JSON.stringify(conv.unreadCount)}`)
        console.log(`   - Status: ${conv.status}`)
        console.log(`   - Dernière mise à jour: ${conv.updatedAt}`)
      })
    }
    
    if (messageCount > 0) {
      console.log('\n📨 DÉTAILS DES MESSAGES:')
      console.log('=' .repeat(50))
      
      const messages = await prisma.message.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
      
      messages.forEach((msg, index) => {
        console.log(`${index + 1}. Message ${msg.id}`)
        console.log(`   - Conversation: ${msg.conversationId}`)
        console.log(`   - Expéditeur: ${msg.senderType}`)
        console.log(`   - SenderId: ${msg.senderId}`)
        console.log(`   - Contenu: ${msg.content.substring(0, 100)}...`)
        console.log(`   - Date: ${msg.createdAt}`)
        console.log(`   - Lu: ${msg.readAt ? 'Oui' : 'Non'}`)
        console.log('')
      })
    }
    
    // Vérifier les partenaires
    console.log('\n🤝 PARTENAIRES:')
    console.log('=' .repeat(50))
    
    const partners = await prisma.partner.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    partners.forEach((partner, index) => {
      console.log(`${index + 1}. ${partner.companyName}`)
      console.log(`   - Utilisateur: ${partner.user.name} (${partner.user.email})`)
      console.log(`   - Type: ${partner.serviceType}`)
      console.log(`   - ID: ${partner.id}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkConversations()

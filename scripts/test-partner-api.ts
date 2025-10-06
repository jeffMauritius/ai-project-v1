import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPartnerAPI() {
  try {
    console.log('🔍 Test de l\'API partenaire...\n')
    
    // Trouver le partenaire "Adeline Déco"
    const partner = await prisma.partner.findFirst({
      where: {
        companyName: 'Adeline Déco'
      }
    })
    
    if (!partner) {
      console.log('❌ Partenaire "Adeline Déco" non trouvé')
      return
    }
    
    console.log(`✅ Partenaire trouvé: ${partner.companyName}`)
    console.log(`   - ID: ${partner.id}`)
    console.log(`   - UserId: ${partner.userId}`)
    
    // Trouver les storefronts du partenaire
    const storefronts = await prisma.partnerStorefront.findMany({
      where: { partnerId: partner.id },
      select: { id: true }
    })
    
    console.log(`\n🏪 Storefronts du partenaire:`)
    storefronts.forEach((storefront, index) => {
      console.log(`   ${index + 1}. ${storefront.id}`)
    })
    
    const storefrontIds = storefronts.map(s => s.id)
    
    // Chercher les conversations pour ces storefronts
    const conversations = await prisma.conversation.findMany({
      where: {
        storefrontId: {
          in: storefrontIds
        }
      }
    })
    
    console.log(`\n💬 Conversations trouvées: ${conversations.length}`)
    conversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.id}`)
      console.log(`      - StorefrontId: ${conv.storefrontId}`)
      console.log(`      - UserId: ${conv.userId}`)
      console.log(`      - Participants: ${JSON.stringify(conv.participants)}`)
    })
    
    // Vérifier spécifiquement la conversation problématique
    const specificConversation = await prisma.conversation.findFirst({
      where: {
        id: '68d789dfebfe40a2a8688f04'
      }
    })
    
    if (specificConversation) {
      console.log(`\n🎯 Conversation spécifique trouvée:`)
      console.log(`   - ID: ${specificConversation.id}`)
      console.log(`   - StorefrontId: ${specificConversation.storefrontId}`)
      console.log(`   - UserId: ${specificConversation.userId}`)
      
      // Vérifier si ce storefront appartient au partenaire
      const storefrontBelongsToPartner = storefrontIds.includes(specificConversation.storefrontId)
      console.log(`   - Storefront appartient au partenaire: ${storefrontBelongsToPartner}`)
      
      if (!storefrontBelongsToPartner) {
        console.log(`   ❌ PROBLÈME: Le storefront ${specificConversation.storefrontId} n'appartient pas au partenaire!`)
        
        // Vérifier à qui appartient ce storefront
        const storefrontOwner = await prisma.partnerStorefront.findUnique({
          where: { id: specificConversation.storefrontId },
          include: {
            partner: {
              select: {
                companyName: true,
                id: true
              }
            }
          }
        })
        
        if (storefrontOwner) {
          console.log(`   - Propriétaire réel: ${storefrontOwner.partner?.companyName} (${storefrontOwner.partner?.id})`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPartnerAPI()

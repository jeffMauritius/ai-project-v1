import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMonaIlsa() {
  try {
    console.log('🔍 Vérification du partenaire Mona Ilsa...')

    // 1. Chercher l'utilisateur par email
    console.log('\n1. Recherche de l\'utilisateur Mona Ilsa...')
    const user = await prisma.user.findUnique({
      where: { email: '68b54449a15c57f76264a4e2@monmariage.ai' }
    })

    if (user) {
      console.log('✅ Utilisateur trouvé:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      })
    } else {
      console.log('❌ Utilisateur non trouvé')
      return
    }

    // 2. Chercher le profil partenaire
    console.log('\n2. Recherche du profil partenaire...')
    const partner = await prisma.partner.findFirst({
      where: { userId: user.id }
    })

    if (partner) {
      console.log('✅ Profil partenaire trouvé:', {
        id: partner.id,
        companyName: partner.companyName,
        serviceType: partner.serviceType
      })
    } else {
      console.log('❌ Profil partenaire non trouvé')
      return
    }

    // 3. Chercher le storefront
    console.log('\n3. Recherche du storefront...')
    const storefront = await prisma.partnerStorefront.findFirst({
      where: { partnerId: partner.id }
    })

    if (storefront) {
      console.log('✅ Storefront trouvé:', {
        id: storefront.id,
        type: storefront.type,
        isActive: storefront.isActive
      })
    } else {
      console.log('❌ Storefront non trouvé')
      return
    }

    // 4. Vérifier les conversations existantes
    console.log('\n4. Vérification des conversations existantes...')
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
        _count: {
          select: { messages: true }
        }
      }
    })

    console.log(`📊 ${conversations.length} conversations trouvées:`)
    conversations.forEach((conv, index) => {
      const isClient = conv.clientId === user.id
      const otherUser = isClient ? conv.partner : conv.client
      console.log(`   ${index + 1}. ${otherUser?.name || 'Utilisateur'} - ${conv._count.messages} messages`)
    })

    console.log('\n🎉 Vérification terminée !')
    console.log('\n📱 Pour tester la messagerie:')
    console.log(`   1. Storefront ID: ${storefront.id}`)
    console.log(`   2. Partenaire ID: ${partner.id}`)
    console.log(`   3. Utilisateur ID: ${user.id}`)

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la vérification
checkMonaIlsa() 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function simulatePartnerAPI() {
  try {
    console.log('🔍 Simulation de l\'API partenaire...\n')
    
    // Simuler la session du partenaire "Adeline Déco"
    const partnerUserId = '68bed5ea72afc59ca2deb610' // UserId du partenaire
    
    console.log(`👤 Simulation session pour UserId: ${partnerUserId}`)
    
    // Trouver le partenaire associé à cet utilisateur
    const partner = await prisma.partner.findFirst({
      where: {
        userId: partnerUserId
      }
    })

    if (!partner) {
      console.log('❌ Partner not found')
      return
    }

    console.log(`✅ Partenaire trouvé: ${partner.companyName}`)

    // Trouver les storefronts du partenaire
    const storefronts = await prisma.partnerStorefront.findMany({
      where: { partnerId: partner.id },
      select: { id: true }
    })

    const storefrontIds = storefronts.map(s => s.id)
    console.log(`🏪 Storefronts trouvés: ${storefrontIds.length}`)

    // Récupérer toutes les conversations du partenaire
    const conversations = await prisma.conversation.findMany({
      where: {
        storefrontId: {
          in: storefrontIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        storefront: {
          select: {
            id: true,
            type: true,
            establishment: {
              select: {
                id: true,
                name: true
              }
            },
            partner: {
              select: {
                id: true,
                companyName: true,
                serviceType: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    console.log(`💬 Conversations trouvées: ${conversations.length}`)

    // Transformer les données pour correspondre au format attendu par le frontend
    const formattedConversations = conversations.map(conv => {
      const lastMessage = conv.messages[0]
      const participants = conv.participants as any
      
      return {
        id: conv.id,
        client: {
          name: participants?.user?.name || conv.user.name || 'Utilisateur',
          avatar: '', // Pas d'avatar pour l'instant
          type: conv.storefront.type === 'VENUE' 
            ? conv.storefront.establishment?.name || 'Lieu'
            : conv.storefront.partner?.serviceType || 'Prestataire'
        },
        messages: [], // Les messages seront chargés séparément
        lastMessage: lastMessage?.content || '',
        date: lastMessage?.createdAt.toISOString() || conv.updatedAt.toISOString(),
        unread: (conv.unreadCount as any)?.provider > 0,
        quoteRequest: {
          id: conv.id,
          status: 'active',
          eventDate: '',
          guestCount: '',
          eventType: '',
          venueLocation: '',
          budget: '',
          message: lastMessage?.content || null,
          customerEmail: participants?.user?.email || conv.user.email || '',
          customerName: participants?.user?.name || conv.user.name || 'Utilisateur'
        }
      }
    })

    console.log(`\n📋 Conversations formatées:`)
    formattedConversations.forEach((conv, index) => {
      console.log(`${index + 1}. ${conv.id}`)
      console.log(`   - Client: ${conv.client.name}`)
      console.log(`   - Type: ${conv.client.type}`)
      console.log(`   - Dernier message: ${conv.lastMessage}`)
      console.log(`   - Non lu: ${conv.unread}`)
    })

    const result = { conversations: formattedConversations }
    console.log(`\n✅ Résultat final:`)
    console.log(JSON.stringify(result, null, 2))

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simulatePartnerAPI()

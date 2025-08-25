import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStatus() {
  try {
    console.log('🔍 Vérification du statut de TRAITEUR 7...')

    // Récupérer un utilisateur existant
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé.')
      return
    }

    // Vérifier la consultation
    const consultation = await prisma.consultedStorefront.findFirst({
      where: {
        userId: user.id,
        storefrontId: '507f1f77bcf86cd799439016'
      }
    })

    if (consultation) {
      console.log(`📋 Consultation trouvée:`)
      console.log(`   - Nom: ${consultation.name}`)
      console.log(`   - Statut: ${consultation.status}`)
      console.log(`   - Type: ${consultation.type}`)
      console.log(`   - Service: ${consultation.serviceType}`)
      console.log(`   - Dernière mise à jour: ${consultation.updatedAt}`)
    } else {
      console.log('❌ Aucune consultation trouvée pour TRAITEUR 7')
    }

    // Vérifier le favori
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        storefrontId: '507f1f77bcf86cd799439016'
      }
    })

    if (favorite) {
      console.log(`\n💖 Favori trouvé:`)
      console.log(`   - Nom: ${favorite.name}`)
      console.log(`   - Créé le: ${favorite.createdAt}`)
    } else {
      console.log('\n❌ Aucun favori trouvé pour TRAITEUR 7')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStatus() 
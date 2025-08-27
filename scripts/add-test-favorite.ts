import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addTestFavorite() {
  try {
    console.log('🌱 Ajout d\'un favori de test...')

    // Récupérer un utilisateur existant
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé.')
      return
    }

    console.log(`👤 Utilisateur: ${user.email}`)

    // Créer un favori de test pour "TRAITEUR 7"
    const testFavorite = await prisma.favorite.create({
      data: {
        storefrontId: '507f1f77bcf86cd799439016', // ID fictif pour TRAITEUR 7
        name: 'TRAITEUR 7',
        location: 'Paris, France',
        rating: 4.5,
        numberOfReviews: 12,
        description: 'Traiteur spécialisé en cuisine française',
        imageUrl: '/placeholder-venue.jpg',
        userId: user.id
      }
    })

    console.log(`✅ Favori créé: ${testFavorite.name} (${testFavorite.storefrontId})`)

    // Vérifier si une consultation existe déjà
    const existingConsultation = await prisma.consultedStorefront.findFirst({
      where: {
        userId: user.id,
        storefrontId: '507f1f77bcf86cd799439016'
      }
    })

    if (existingConsultation) {
      console.log(`📋 Consultation existante trouvée: ${existingConsultation.name} - ${existingConsultation.status}`)
      
      // Mettre à jour le statut vers SAVED
      const updatedConsultation = await prisma.consultedStorefront.update({
        where: { id: existingConsultation.id },
        data: { status: 'SAVED' }
      })
      
      console.log(`✅ Statut mis à jour: ${updatedConsultation.status}`)
    } else {
      console.log(`❌ Aucune consultation trouvée pour TRAITEUR 7`)
      
      // Créer une consultation avec statut SAVED
      const newConsultation = await prisma.consultedStorefront.create({
        data: {
          storefrontId: '507f1f77bcf86cd799439016',
          name: 'TRAITEUR 7',
          type: 'PARTNER',
          serviceType: 'TRAITEUR',
          status: 'SAVED',
          userId: user.id
        }
      })
      
      console.log(`✅ Nouvelle consultation créée: ${newConsultation.name} - ${newConsultation.status}`)
    }

    console.log('\n✅ Test terminé!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestFavorite() 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSearchHistory() {
  try {
    console.log('🌱 Début du seeding de l\'historique des recherches...')

    // Récupérer un utilisateur existant
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé. Créez d\'abord un utilisateur.')
      return
    }

    console.log(`👤 Utilisateur trouvé: ${user.email}`)

    // Données d'exemple pour l'historique des recherches
    const searchHistoryData = [
      {
        query: 'Château avec jardin près de Paris',
        type: 'LIEU',
        results: [
          { name: 'Château de Vaux-le-Vicomte', status: 'Consulté' },
          { name: 'Château de Fontainebleau', status: 'Consulté' },
          { name: 'Château de Chantilly', status: 'Consulté' }
        ]
      },
      {
        query: 'Photographe style reportage',
        type: 'PRESTATAIRE',
        results: [
          { name: 'Studio Lumière', status: 'Consulté' },
          { name: 'Capture Moments', status: 'Consulté' },
          { name: 'Photo Élégance', status: 'Consulté' }
        ]
      },
      {
        query: 'Traiteur gastronomique pour 100 personnes',
        type: 'PRESTATAIRE',
        results: [
          { name: 'Cuisine Étoilée', status: 'Consulté' },
          { name: 'Saveurs & Traditions', status: 'Consulté' },
          { name: 'Gastronomie Paris', status: 'Consulté' }
        ]
      },
      {
        query: 'Salle de réception moderne Lyon',
        type: 'LIEU',
        results: [
          { name: 'Espace Moderne Lyon', status: 'Consulté' },
          { name: 'Le Grand Hôtel', status: 'Consulté' },
          { name: 'Villa Contemporaine', status: 'Consulté' }
        ]
      },
      {
        query: 'Fleuriste pour décoration de mariage',
        type: 'PRESTATAIRE',
        results: [
          { name: 'Fleurs & Co', status: 'Consulté' },
          { name: 'Atelier Botanique', status: 'Consulté' },
          { name: 'Jardin des Fleurs', status: 'Consulté' }
        ]
      }
    ]

    // Supprimer l'historique existant pour cet utilisateur
    await prisma.searchHistory.deleteMany({
      where: { userId: user.id }
    })

    console.log('🗑️ Ancien historique supprimé')

    // Créer les nouvelles entrées d'historique
    for (const data of searchHistoryData) {
      await prisma.searchHistory.create({
        data: {
          query: data.query,
          type: data.type,
          results: data.results,
          userId: user.id
        }
      })
    }

    console.log(`✅ ${searchHistoryData.length} entrées d'historique créées avec succès!`)

    // Vérifier les données créées
    const createdHistory = await prisma.searchHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    console.log('\n📋 Historique créé:')
    createdHistory.forEach((item: any, index: number) => {
      console.log(`${index + 1}. ${item.query} (${item.type})`)
    })

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSearchHistory() 
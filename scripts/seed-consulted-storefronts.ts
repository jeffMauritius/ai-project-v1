import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedConsultedStorefronts() {
  try {
    console.log('🌱 Début du seeding des vitrines consultées...')

    // Récupérer un utilisateur existant
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé. Créez d\'abord un utilisateur.')
      return
    }

    console.log(`👤 Utilisateur trouvé: ${user.email}`)

    // Données d'exemple pour les vitrines consultées
    const consultedStorefrontsData = [
      {
        storefrontId: '507f1f77bcf86cd799439011', // ID fictif
        name: 'Château de Vaux-le-Vicomte',
        type: 'VENUE',
        serviceType: 'Lieu de réception',
        status: 'CONSULTED'
      },
      {
        storefrontId: '507f1f77bcf86cd799439012', // ID fictif
        name: 'Studio Lumière',
        type: 'PARTNER',
        serviceType: 'PHOTOGRAPHE',
        status: 'CONSULTED'
      },
      {
        storefrontId: '507f1f77bcf86cd799439013', // ID fictif
        name: 'Cuisine Étoilée',
        type: 'PARTNER',
        serviceType: 'TRAITEUR',
        status: 'SAVED'
      },
      {
        storefrontId: '507f1f77bcf86cd799439014', // ID fictif
        name: 'Espace Moderne Lyon',
        type: 'VENUE',
        serviceType: 'Lieu de réception',
        status: 'CONSULTED'
      },
      {
        storefrontId: '507f1f77bcf86cd799439015', // ID fictif
        name: 'Fleurs & Co',
        type: 'PARTNER',
        serviceType: 'FLORISTE',
        status: 'CONTACTED'
      }
    ]

    // Supprimer les vitrines consultées existantes pour cet utilisateur
    await prisma.consultedStorefront.deleteMany({
      where: { userId: user.id }
    })

    console.log('🗑️ Anciennes vitrines consultées supprimées')

    // Créer les nouvelles vitrines consultées
    for (const data of consultedStorefrontsData) {
      await prisma.consultedStorefront.create({
        data: {
          storefrontId: data.storefrontId,
          name: data.name,
          type: data.type,
          serviceType: data.serviceType,
          status: data.status,
          userId: user.id
        }
      })
    }

    console.log(`✅ ${consultedStorefrontsData.length} vitrines consultées créées avec succès!`)

    // Vérifier les données créées
    const createdConsultations = await prisma.consultedStorefront.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' }
    })

    console.log('\n📋 Vitrines consultées créées:')
    createdConsultations.forEach((consultation: any, index: number) => {
      console.log(`${index + 1}. ${consultation.name} (${consultation.type}) - ${consultation.status}`)
    })

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedConsultedStorefronts() 
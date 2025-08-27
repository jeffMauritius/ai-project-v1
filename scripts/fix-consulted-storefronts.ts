import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixConsultedStorefronts() {
  try {
    console.log('🔍 Vérification des vitrines consultées...')

    // Récupérer un utilisateur existant
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé.')
      return
    }

    console.log(`👤 Utilisateur: ${user.email}`)

    // Récupérer toutes les vitrines consultées
    const consultedStorefronts = await prisma.consultedStorefront.findMany({
      where: { userId: user.id }
    })

    console.log(`📋 ${consultedStorefronts.length} vitrines consultées trouvées:`)
    consultedStorefronts.forEach((consultation, index) => {
      console.log(`${index + 1}. ${consultation.name} (${consultation.storefrontId}) - ${consultation.status}`)
    })

    // Récupérer tous les favoris
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id }
    })

    console.log(`\n💖 ${favorites.length} favoris trouvés:`)
    favorites.forEach((favorite, index) => {
      console.log(`${index + 1}. ${favorite.name} (${favorite.storefrontId})`)
    })

    // Vérifier la cohérence
    console.log('\n🔍 Vérification de la cohérence:')
    for (const favorite of favorites) {
      const consultation = consultedStorefronts.find(c => c.storefrontId === favorite.storefrontId)
      if (consultation) {
        console.log(`✅ ${favorite.name}: Consultation trouvée, statut: ${consultation.status}`)
        if (consultation.status !== 'SAVED') {
          console.log(`⚠️  ${favorite.name}: Statut incorrect (${consultation.status}), mise à jour vers SAVED`)
          await prisma.consultedStorefront.update({
            where: { id: consultation.id },
            data: { status: 'SAVED' }
          })
        }
      } else {
        console.log(`❌ ${favorite.name}: Pas de consultation trouvée, création...`)
        await prisma.consultedStorefront.create({
          data: {
            storefrontId: favorite.storefrontId,
            name: favorite.name,
            type: 'PARTNER',
            serviceType: 'Prestataire',
            status: 'SAVED',
            userId: user.id
          }
        })
      }
    }

    console.log('\n✅ Vérification terminée!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixConsultedStorefronts() 
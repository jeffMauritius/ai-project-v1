import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkChateau10() {
  try {
    console.log('🔍 Vérification de CHATEAU 10...')

    // Récupérer un utilisateur existant
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé.')
      return
    }

    console.log(`👤 Utilisateur: ${user.email}`)

    // Récupérer toutes les consultations
    const consultations = await prisma.consultedStorefront.findMany({
      where: { userId: user.id }
    })

    console.log(`\n📋 Toutes les consultations:`)
    consultations.forEach((consultation, index) => {
      console.log(`${index + 1}. ${consultation.name} (${consultation.storefrontId}) - ${consultation.status}`)
    })

    // Chercher CHATEAU 10 spécifiquement
    const chateau10Consultation = consultations.find(c => c.name.includes('CHATEAU 10') || c.name.includes('Château 10'))
    
    if (chateau10Consultation) {
      console.log(`\n🏰 CHATEAU 10 trouvé dans les consultations:`)
      console.log(`   - ID: ${chateau10Consultation.id}`)
      console.log(`   - StorefrontId: ${chateau10Consultation.storefrontId}`)
      console.log(`   - Statut: ${chateau10Consultation.status}`)
      console.log(`   - Type: ${chateau10Consultation.type}`)
    } else {
      console.log(`\n❌ CHATEAU 10 non trouvé dans les consultations`)
    }

    // Récupérer tous les favoris
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id }
    })

    console.log(`\n💖 Tous les favoris:`)
    favorites.forEach((favorite, index) => {
      console.log(`${index + 1}. ${favorite.name} (${favorite.storefrontId})`)
    })

    // Chercher CHATEAU 10 dans les favoris
    const chateau10Favorite = favorites.find(f => f.name.includes('CHATEAU 10') || f.name.includes('Château 10'))
    
    if (chateau10Favorite) {
      console.log(`\n🏰 CHATEAU 10 trouvé dans les favoris:`)
      console.log(`   - ID: ${chateau10Favorite.id}`)
      console.log(`   - StorefrontId: ${chateau10Favorite.storefrontId}`)
      console.log(`   - Nom: ${chateau10Favorite.name}`)
      
      // Vérifier si la consultation correspond
      const matchingConsultation = consultations.find(c => c.storefrontId === chateau10Favorite.storefrontId)
      if (matchingConsultation) {
        console.log(`\n✅ Consultation correspondante trouvée:`)
        console.log(`   - Statut actuel: ${matchingConsultation.status}`)
        console.log(`   - Doit être: SAVED`)
        
        if (matchingConsultation.status !== 'SAVED') {
          console.log(`\n⚠️  Mise à jour du statut vers SAVED...`)
          const updated = await prisma.consultedStorefront.update({
            where: { id: matchingConsultation.id },
            data: { status: 'SAVED' }
          })
          console.log(`✅ Statut mis à jour: ${updated.status}`)
        }
      } else {
        console.log(`\n❌ Aucune consultation trouvée avec le storefrontId: ${chateau10Favorite.storefrontId}`)
        console.log(`Création d'une nouvelle consultation...`)
        
        const newConsultation = await prisma.consultedStorefront.create({
          data: {
            storefrontId: chateau10Favorite.storefrontId,
            name: chateau10Favorite.name,
            type: 'VENUE',
            serviceType: 'Lieu de réception',
            status: 'SAVED',
            userId: user.id
          }
        })
        console.log(`✅ Nouvelle consultation créée: ${newConsultation.name} - ${newConsultation.status}`)
      }
    } else {
      console.log(`\n❌ CHATEAU 10 non trouvé dans les favoris`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkChateau10() 
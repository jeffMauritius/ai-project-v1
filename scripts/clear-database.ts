import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearDatabase() {
  console.log('🗑️  Début du nettoyage de la base de données...')
  
  try {
    // Suppression de toutes les collections dans l'ordre pour éviter les erreurs de contraintes
    console.log('📝 Suppression des favoris...')
    await prisma.favorite.deleteMany({})
    
    console.log('📝 Suppression des demandes de devis...')
    await prisma.quoteRequest.deleteMany({})
    
    console.log('📝 Suppression des médias...')
    await prisma.media.deleteMany({})
    
    console.log('📝 Suppression des vitrines partenaires...')
    await prisma.partnerStorefront.deleteMany({})
    
    console.log('📝 Suppression des partenaires...')
    await prisma.partner.deleteMany({})
    
    console.log('📝 Suppression des options de réception...')
    await prisma.receptionOptions.deleteMany({})
    
    console.log('📝 Suppression des espaces de réception...')
    await prisma.receptionSpace.deleteMany({})
    
    console.log('📝 Suppression des établissements...')
    await prisma.establishment.deleteMany({})
    
    console.log('📝 Suppression des images...')
    await prisma.image.deleteMany({})
    
    console.log('📝 Suppression des tables...')
    await prisma.table.deleteMany({})
    
    console.log('📝 Suppression des invités...')
    await prisma.guest.deleteMany({})
    
    console.log('📝 Suppression des groupes d\'invités...')
    await prisma.guestGroup.deleteMany({})
    
    console.log('📝 Suppression de l\'historique de recherche...')
    await prisma.searchHistory.deleteMany({})
    
    console.log('📝 Suppression des établissements consultés...')
    await prisma.consultedStorefront.deleteMany({})
    
    console.log('📝 Suppression des abonnements...')
    await prisma.subscription.deleteMany({})
    
    console.log('📝 Suppression des paiements...')
    await prisma.payment.deleteMany({})
    
    console.log('📝 Suppression des profils...')
    await prisma.profile.deleteMany({})
    
    console.log('📝 Suppression des données utilisateur...')
    await prisma.user.deleteMany({})
    
    console.log('✅ Base de données vidée avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de la base de données:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  clearDatabase()
    .then(() => {
      console.log('🎉 Nettoyage terminé !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { clearDatabase }

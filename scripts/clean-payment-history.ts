import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanPaymentHistory() {
  try {
    console.log('🧹 Nettoyage de l\'historique des paiements factices...')

    // Supprimer tous les paiements
    const deletedPayments = await prisma.payment.deleteMany({})
    console.log(`✅ ${deletedPayments.count} paiements supprimés`)

    // Supprimer tous les abonnements
    const deletedSubscriptions = await prisma.subscription.deleteMany({})
    console.log(`✅ ${deletedSubscriptions.count} abonnements supprimés`)

    // Supprimer toutes les informations de facturation
    const deletedBillingInfo = await prisma.billingInfo.deleteMany({})
    console.log(`✅ ${deletedBillingInfo.count} informations de facturation supprimées`)

    // Réinitialiser les IDs Stripe des utilisateurs
    const updatedUsers = await prisma.user.updateMany({
      data: {
        stripeCustomerId: null,
        stripePaymentMethodId: null
      }
    })
    console.log(`✅ ${updatedUsers.count} utilisateurs mis à jour (IDs Stripe supprimés)`)

    console.log('🎉 Historique des paiements nettoyé avec succès!')
    console.log('💡 Vous pouvez maintenant tester l\'intégration Stripe avec des données propres.')
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanPaymentHistory()

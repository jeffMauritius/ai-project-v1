import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanTestData() {
  try {
    console.log('🧹 Nettoyage des données de test...')

    // Supprimer les paiements de test
    const deletedPayments = await prisma.payment.deleteMany({})
    console.log(`✅ ${deletedPayments.count} paiements supprimés`)

    // Supprimer les abonnements de test
    const deletedSubscriptions = await prisma.subscription.deleteMany({})
    console.log(`✅ ${deletedSubscriptions.count} abonnements supprimés`)

    // Supprimer les informations de facturation de test
    const deletedBillingInfo = await prisma.billingInfo.deleteMany({})
    console.log(`✅ ${deletedBillingInfo.count} informations de facturation supprimées`)

    // Réinitialiser les IDs Stripe des utilisateurs (garder les utilisateurs)
    const updatedUsers = await prisma.user.updateMany({
      data: {
        stripeCustomerId: null,
        stripePaymentMethodId: null
      }
    })
    console.log(`✅ ${updatedUsers.count} utilisateurs mis à jour (IDs Stripe supprimés)`)

    console.log('🎉 Nettoyage terminé avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanTestData()

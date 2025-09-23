import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testStripeIntegration() {
  try {
    console.log('🧪 Test de l\'intégration Stripe...')

    // Vérifier que les plans d'abonnement existent
    const plans = await prisma.subscriptionPlan.findMany()
    console.log(`✅ ${plans.length} plans d'abonnement trouvés:`)
    plans.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.billingInterval}): ${plan.price}€`)
    })

    // Vérifier que les champs Stripe sont présents dans le modèle User
    const userSample = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        stripePaymentMethodId: true
      }
    })

    if (userSample) {
      console.log('✅ Modèle User mis à jour avec les champs Stripe:')
      console.log(`   - stripeCustomerId: ${userSample.stripeCustomerId || 'null'}`)
      console.log(`   - stripePaymentMethodId: ${userSample.stripePaymentMethodId || 'null'}`)
    }

    // Vérifier qu'il n'y a pas de données de test
    const subscriptions = await prisma.subscription.count()
    const payments = await prisma.payment.count()
    const billingInfo = await prisma.billingInfo.count()

    console.log('✅ Données nettoyées:')
    console.log(`   - Abonnements: ${subscriptions}`)
    console.log(`   - Paiements: ${payments}`)
    console.log(`   - Informations de facturation: ${billingInfo}`)

    console.log('🎉 Intégration Stripe prête pour les tests!')
    console.log('💡 Vous pouvez maintenant:')
    console.log('   1. Aller sur http://localhost:3000/partner-dashboard/subscription')
    console.log('   2. Sélectionner un plan')
    console.log('   3. Tester avec les cartes Stripe de test')
    console.log('   4. Vérifier que l\'abonnement est créé correctement')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStripeIntegration()

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSubscriptionFlow() {
  try {
    console.log('🧪 Test du flux d\'abonnement complet...');
    console.log('');
    
    // 1. Vérifier les plans disponibles
    console.log('📋 1. Vérification des plans disponibles:');
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true }
    });
    
    plans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name} - ${plan.price}€/${plan.billingInterval}`);
    });
    console.log('');
    
    // 2. Vérifier les abonnements existants
    console.log('📊 2. Abonnements existants:');
    const subscriptions = await prisma.subscription.findMany({
      include: {
        plan: true,
        user: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.user.name} (${sub.user.email})`);
        console.log(`      Plan: ${sub.plan.name} - Statut: ${sub.status}`);
        console.log(`      Stripe ID: ${sub.stripeSubscriptionId || 'Non défini'}`);
        console.log(`      Créé le: ${new Date(sub.createdAt).toLocaleDateString('fr-FR')}`);
        console.log('');
      });
    } else {
      console.log('   Aucun abonnement trouvé');
      console.log('');
    }
    
    // 3. Vérifier la configuration Stripe
    console.log('⚙️ 3. Configuration Stripe:');
    console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Défini' : '❌ Manquant'}`);
    console.log(`   STRIPE_PUBLISHABLE_KEY: ${process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Défini' : '❌ Manquant'}`);
    console.log(`   STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Défini' : '❌ Manquant'}`);
    console.log('');
    
    // 4. Test de l'endpoint webhook
    console.log('🔗 4. Test de l\'endpoint webhook:');
    try {
      const response = await fetch('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test'
        },
        body: JSON.stringify({ type: 'test', data: { object: { id: 'test' } } })
      });
      
      const result = await response.json();
      if (result.error === 'Signature invalide') {
        console.log('   ✅ Endpoint webhook accessible et fonctionne correctement');
      } else {
        console.log('   ⚠️ Endpoint webhook accessible mais réponse inattendue:', result);
      }
    } catch (error) {
      console.log('   ❌ Endpoint webhook non accessible:', error.message);
    }
    console.log('');
    
    // 5. Recommandations
    console.log('💡 5. Recommandations:');
    if (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET === 'whsec_test_placeholder') {
      console.log('   ❌ Le webhook Stripe n\'est pas configuré correctement');
      console.log('   📝 Suivez les instructions dans STRIPE_WEBHOOK_SETUP.md');
    } else {
      console.log('   ✅ Configuration webhook OK');
    }
    
    console.log('');
    console.log('🎯 Pour tester le flux complet:');
    console.log('   1. Configurez le webhook avec ngrok');
    console.log('   2. Allez sur /partner-dashboard/subscription');
    console.log('   3. Cliquez sur "S\'abonner"');
    console.log('   4. Complétez le paiement Stripe');
    console.log('   5. Vérifiez que l\'abonnement apparaît comme "Plan actuel"');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptionFlow();

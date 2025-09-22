require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testWebhookLocally() {
  try {
    console.log('🧪 Test du webhook en local...');
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Installez ngrok: https://ngrok.com/download');
    console.log('2. Dans un terminal, lancez: ngrok http 3000');
    console.log('3. Copiez l\'URL HTTPS (ex: https://abc123.ngrok.io)');
    console.log('4. Exécutez ce script avec l\'URL ngrok');
    console.log('');
    
    const ngrokUrl = process.argv[2];
    if (!ngrokUrl) {
      console.log('❌ Usage: node scripts/test-webhook-locally.js <ngrok-url>');
      console.log('   Exemple: node scripts/test-webhook-locally.js https://abc123.ngrok.io');
      return;
    }
    
    const webhookUrl = `${ngrokUrl}/api/stripe/webhook`;
    console.log('📡 Configuration du webhook avec l\'URL:', webhookUrl);
    
    // Événements à écouter
    const events = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ];
    
    // Créer le webhook
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: events,
      description: 'MonMariage.AI - Webhook local pour tests'
    });
    
    console.log('✅ Webhook créé avec succès !');
    console.log('🔑 Secret du webhook:', webhook.secret);
    console.log('📋 ID du webhook:', webhook.id);
    console.log('');
    console.log('📝 Ajoutez ce secret à votre fichier .env.local:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    console.log('');
    console.log('🔄 Redémarrez votre serveur Next.js après avoir mis à jour le .env.local');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du webhook:', error.message);
  }
}

testWebhookLocally();

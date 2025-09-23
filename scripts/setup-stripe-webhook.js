const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupWebhook() {
  try {
    console.log('🔧 Configuration du webhook Stripe...');
    
    // URL du webhook (à adapter selon votre environnement)
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? 'https://votre-domaine.com/api/stripe/webhook'
      : 'https://votre-ngrok-url.ngrok.io/api/stripe/webhook';
    
    console.log('📡 URL du webhook:', webhookUrl);
    
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
      description: 'MonMariage.AI - Webhook pour les abonnements'
    });
    
    console.log('✅ Webhook créé avec succès !');
    console.log('🔑 Secret du webhook:', webhook.secret);
    console.log('📋 ID du webhook:', webhook.id);
    console.log('');
    console.log('📝 Ajoutez ce secret à votre fichier .env:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du webhook:', error.message);
  }
}

setupWebhook();

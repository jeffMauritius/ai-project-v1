/**
 * Script de test pour vérifier l'envoi d'emails
 * Usage: node scripts/test-email.js
 */

require('dotenv').config({ path: '.env.local' });
const { sendMail } = require('../lib/email');

async function testEmail() {
  console.log('🧪 Test d\'envoi d\'email...\n');

  // Vérifier la configuration
  if (!process.env.ZEPTOMAIL_TOKEN) {
    console.error('❌ ERREUR: ZEPTOMAIL_TOKEN non configuré dans .env.local');
    console.log('\nPour configurer:');
    console.log('1. Créez un fichier .env.local à la racine du projet');
    console.log('2. Ajoutez: ZEPTOMAIL_TOKEN=votre_token_ici');
    console.log('3. Optionnel: ZEPTOMAIL_FROM_EMAIL=noreply@monmariage.ai');
    console.log('4. Optionnel: ZEPTOMAIL_FROM_NAME=MonMariage.ai');
    process.exit(1);
  }

  console.log('✅ Configuration ZeptoMail trouvée');
  console.log(`   FROM_EMAIL: ${process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@monmariage.ai'}`);
  console.log(`   FROM_NAME: ${process.env.ZEPTOMAIL_FROM_NAME || 'MonMariage.ai'}\n`);

  // Test d'envoi à jahangeer@monmariage.ai
  const testEmail = 'jahangeer@monmariage.ai';
  const testSubject = '[TEST] Vérification système email MonMariage.ai';
  const testHtml = `
    <h2>Test d'envoi d'email</h2>
    <p>Ceci est un email de test pour vérifier que le système d'envoi d'emails fonctionne correctement.</p>
    <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
    <p><strong>Serveur:</strong> ${process.env.NODE_ENV || 'development'}</p>
    <hr>
    <p><em>Si vous recevez cet email, le système fonctionne correctement ! ✅</em></p>
  `;

  try {
    console.log(`📧 Envoi d'un email de test à ${testEmail}...`);
    await sendMail({
      to: testEmail,
      subject: testSubject,
      html: testHtml
    });
    console.log('✅ Email envoyé avec succès !');
    console.log(`   Vérifiez la boîte de réception de ${testEmail}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error.message);
    if (error.response) {
      console.error('   Détails:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testEmail();

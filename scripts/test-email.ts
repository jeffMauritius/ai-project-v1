/**
 * Script de test pour vérifier l'envoi d'emails
 * Usage: npx tsx scripts/test-email.ts
 */

import { sendMail } from '../lib/email';

async function testEmail() {
  console.log('🧪 Test d\'envoi d\'email...\n');

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
    console.error('❌ Erreur lors de l\'envoi:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testEmail();

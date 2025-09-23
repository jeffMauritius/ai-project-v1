# 🚀 Configuration Finale du Webhook Stripe

## ✅ État actuel
- ✅ Webhook endpoint créé et fonctionnel
- ✅ Logs améliorés pour le debugging
- ✅ Gestion d'erreurs robuste
- ✅ Scripts de test et diagnostic
- ❌ **Webhook Stripe non configuré** (secret placeholder)

## 🔧 Solution : Configuration du Webhook

### Option 1: Configuration en local avec ngrok (Recommandé pour les tests)

#### Étape 1: Installer ngrok
```bash
# Télécharger depuis https://ngrok.com/download
# Ou via npm
npm install -g ngrok
```

#### Étape 2: Lancer ngrok
```bash
# Dans un terminal séparé
ngrok http 3000
```
**Important:** Copiez l'URL HTTPS (ex: `https://abc123.ngrok.io`)

#### Étape 3: Configurer le webhook
```bash
# Utiliser l'URL ngrok
node scripts/test-webhook-locally.js https://abc123.ngrok.io
```

#### Étape 4: Mettre à jour .env.local
```bash
# Remplacer le secret placeholder par le vrai secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Étape 5: Redémarrer le serveur
```bash
npm run dev
```

### Option 2: Configuration en production

#### Étape 1: Dashboard Stripe
1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer sur "Add endpoint"
3. URL: `https://votre-domaine.com/api/stripe/webhook`

#### Étape 2: Sélectionner les événements
```
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

#### Étape 3: Copier le secret
1. Cliquer sur le webhook créé
2. Section "Signing secret" → "Reveal"
3. Copier le secret (commence par `whsec_`)

#### Étape 4: Mettre à jour .env
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## 🧪 Test du flux complet

### 1. Vérifier la configuration
```bash
node scripts/test-subscription-flow.js
```

### 2. Tester un abonnement
1. Aller sur `/partner-dashboard/subscription`
2. Cliquer sur "S'abonner" 
3. Compléter le paiement Stripe
4. Vérifier les logs du serveur :
```
[WEBHOOK] Nouveau webhook reçu: { hasSignature: true, bodyLength: 1234, timestamp: '...' }
[WEBHOOK] Événement validé: checkout.session.completed evt_xxxxx
[WEBHOOK] Traitement checkout.session.completed
[WEBHOOK] Données de session: { subscriptionId: 'sub_xxxxx', userId: '...', planId: '...' }
[WEBHOOK] Nouvel abonnement créé: 68xxxxx
[WEBHOOK] Traitement terminé avec succès pour: checkout.session.completed
```

### 3. Vérifier le résultat
- L'abonnement doit apparaître comme "Plan actuel"
- Bordure verte et badge "Plan actuel"
- Bouton "Plan actuel" au lieu de "S'abonner"

## 🔍 Debugging

### Logs à surveiller
```bash
# Logs du serveur Next.js
npm run dev

# Logs spécifiques au webhook
grep "WEBHOOK" server.log
```

### Vérification en base
```bash
# Vérifier les abonnements
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.subscription.findMany({
  include: { plan: true, user: true },
  orderBy: { createdAt: 'desc' },
  take: 5
}).then(subs => {
  console.log('Derniers abonnements:', subs);
  prisma.\$disconnect();
});
"
```

## 🎯 Résultat attendu

Après configuration du webhook :

1. **Utilisateur clique "S'abonner"** → Redirection Stripe Checkout ✅
2. **Paiement réussi** → Webhook reçu et traité ✅
3. **Abonnement créé en base** → Statut TRIAL ✅
4. **Page d'abonnement** → Affiche "Plan actuel" ✅

## 🚨 Problèmes courants

### "Signature invalide"
- Vérifier que `STRIPE_WEBHOOK_SECRET` est correct
- Redémarrer le serveur après modification du .env

### "Abonnement non créé"
- Vérifier les logs du webhook
- S'assurer que les métadonnées sont présentes

### "Webhook non reçu"
- Vérifier que l'URL est accessible
- Tester avec ngrok en local
- Vérifier les logs Stripe Dashboard

## 📞 Support

Si le problème persiste :
1. Vérifier les logs du serveur
2. Vérifier les logs Stripe Dashboard
3. Utiliser le script de diagnostic : `node scripts/test-subscription-flow.js`

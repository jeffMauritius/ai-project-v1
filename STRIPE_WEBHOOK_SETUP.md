# 🔧 Configuration du Webhook Stripe

## Problème identifié
Le flux d'abonnement ne fonctionne pas automatiquement car le webhook Stripe n'est pas configuré correctement.

## Solution

### 1. Configuration en local (pour les tests)

#### Étape 1: Installer ngrok
```bash
# Télécharger ngrok depuis https://ngrok.com/download
# Ou via npm
npm install -g ngrok
```

#### Étape 2: Lancer ngrok
```bash
# Dans un terminal séparé
ngrok http 3000
```

#### Étape 3: Configurer le webhook
```bash
# Copier l'URL HTTPS de ngrok (ex: https://abc123.ngrok.io)
# Puis exécuter:
node scripts/test-webhook-locally.js https://abc123.ngrok.io
```

#### Étape 4: Mettre à jour .env.local
```bash
# Ajouter le secret webhook généré dans .env.local
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Étape 5: Redémarrer le serveur
```bash
npm run dev
```

### 2. Configuration en production

#### Étape 1: Créer le webhook dans Stripe Dashboard
1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer sur "Add endpoint"
3. URL: `https://votre-domaine.com/api/stripe/webhook`
4. Événements à sélectionner:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

#### Étape 2: Copier le secret
1. Cliquer sur le webhook créé
2. Dans la section "Signing secret", cliquer sur "Reveal"
3. Copier le secret (commence par `whsec_`)

#### Étape 3: Mettre à jour les variables d'environnement
```bash
# Dans votre fichier .env de production
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 3. Test du webhook

#### Test en local
```bash
# Tester l'endpoint webhook
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type": "test", "data": {"object": {"id": "test"}}}'

# Devrait retourner: {"error":"Signature invalide"}
```

#### Test avec un vrai abonnement
1. Aller sur la page d'abonnement
2. Cliquer sur "S'abonner" 
3. Compléter le paiement Stripe
4. Vérifier les logs du serveur pour voir les messages [WEBHOOK]
5. Vérifier que l'abonnement apparaît comme "Plan actuel"

### 4. Vérification

#### Logs à surveiller
```
[WEBHOOK] Nouveau webhook reçu: { hasSignature: true, bodyLength: 1234, timestamp: '...' }
[WEBHOOK] Événement validé: checkout.session.completed evt_xxxxx
[WEBHOOK] Traitement checkout.session.completed
[WEBHOOK] Données de session: { subscriptionId: 'sub_xxxxx', userId: '...', planId: '...' }
[WEBHOOK] Nouvel abonnement créé: 68xxxxx
[WEBHOOK] Traitement terminé avec succès pour: checkout.session.completed
```

#### Vérification en base de données
```bash
# Vérifier qu'un abonnement a été créé
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

## Résolution des problèmes

### Erreur "Signature invalide"
- Vérifier que `STRIPE_WEBHOOK_SECRET` est correct
- S'assurer que l'URL du webhook est accessible
- Vérifier que le serveur est redémarré après modification du .env

### Abonnement non créé
- Vérifier les logs du webhook
- S'assurer que les métadonnées `userId` et `planId` sont présentes
- Vérifier que l'utilisateur existe en base

### Webhook non reçu
- Vérifier que l'URL est accessible depuis internet
- Tester avec ngrok en local
- Vérifier les logs Stripe Dashboard pour les tentatives de webhook

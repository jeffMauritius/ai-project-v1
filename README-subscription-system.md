# Système d'Abonnement - MonMariage.AI

Ce document décrit le système d'abonnement mis en place pour les comptes partenaires de MonMariage.AI.

## 🏗️ Architecture

### Modèles de Base de Données

Le système utilise les modèles Prisma suivants :

- **SubscriptionPlan** : Définit les plans d'abonnement disponibles
- **Subscription** : Gère les abonnements actifs des utilisateurs
- **BillingInfo** : Stocke les informations de facturation
- **Payment** : Historique des paiements

### Types TypeScript

Les types sont définis dans `types/subscription.ts` :
- `SubscriptionStatus` : ACTIVE, CANCELLED, PAST_DUE, UNPAID, TRIAL
- `BillingInterval` : MONTHLY, YEARLY
- `PaymentStatus` : PENDING, COMPLETED, FAILED, REFUNDED

## 📋 Plans d'Abonnement

### Plan Essentiel (29€/mois ou 279€/an)
- Profil professionnel
- Messagerie avec les clients
- Jusqu'à 10 photos
- Statistiques de base
- Support par email

### Plan Pro (79€/mois ou 759€/an) ⭐ Populaire
- Tout de l'offre Essentiel
- Photos illimitées
- Mise en avant dans les recherches
- Statistiques avancées
- Support prioritaire
- Accès aux événements premium

### Plan Premium (149€/mois ou 1430€/an)
- Tout de l'offre Pro
- Badge Premium sur votre profil
- Accès aux mariages VIP
- Accompagnement personnalisé
- Formation marketing incluse
- Support téléphonique

## 🚀 Installation et Configuration

### 1. Mise à jour du schéma Prisma

Le schéma Prisma a été mis à jour avec les nouveaux modèles. Exécutez :

```bash
npx prisma generate
npx prisma db push
```

### 2. Initialisation des plans

Exécutez le script de configuration :

```bash
npx tsx scripts/setup-subscription-system.ts
```

### 3. Vérification

Vérifiez que les plans ont été créés :

```bash
npx prisma studio
```

## 🔌 API Endpoints

### Récupérer les plans disponibles
```
GET /api/subscription/plans
```

### Récupérer l'abonnement actuel
```
GET /api/subscription
```

### Créer un nouvel abonnement
```
POST /api/subscription
Body: {
  planId: string,
  billingInterval: 'MONTHLY' | 'YEARLY',
  billingInfo: BillingInfo
}
```

### Annuler un abonnement
```
POST /api/subscription/cancel
Body: {
  cancelAtPeriodEnd: boolean
}
```

### Mettre à jour les informations de facturation
```
PUT /api/subscription/billing
Body: {
  billingInfo: Partial<BillingInfo>
}
```

## 🎣 Hook React

Le hook `useSubscription` fournit une interface simple pour gérer les abonnements :

```typescript
const {
  subscription,
  billingInfo,
  plans,
  loading,
  error,
  createSubscription,
  cancelSubscription,
  updateBillingInfo,
  refreshSubscription
} = useSubscription()
```

## 📱 Interface Utilisateur

La page d'abonnement (`/partner-dashboard/subscription`) permet aux utilisateurs de :

- Voir les plans disponibles
- Choisir entre facturation mensuelle ou annuelle
- Créer un nouvel abonnement
- Voir leur abonnement actuel
- Annuler leur abonnement
- Consulter l'historique des paiements

## 🔄 Workflow d'Abonnement

1. **Essai gratuit** : 14 jours automatiques pour tous les nouveaux abonnements
2. **Période de facturation** : Mensuelle ou annuelle selon le choix
3. **Renouvellement automatique** : Sauf si annulé
4. **Annulation** : Possible à tout moment, prend effet à la fin de la période

## 🛡️ Sécurité

- Authentification requise pour toutes les opérations
- Validation des données côté serveur
- Gestion des erreurs appropriée
- Logs des opérations sensibles

## 🔮 Prochaines Étapes

1. **Intégration Stripe** : Pour les paiements réels
2. **Webhooks** : Pour synchroniser les événements de paiement
3. **Facturation automatique** : Renouvellement des abonnements
4. **Notifications** : Emails de rappel et confirmations
5. **Analytics** : Suivi des conversions et métriques

## 🧪 Tests

Pour tester le système :

1. Créez un compte partenaire
2. Accédez à `/partner-dashboard/subscription`
3. Sélectionnez un plan
4. Vérifiez la création de l'abonnement
5. Testez l'annulation

## 📞 Support

Pour toute question sur le système d'abonnement, contactez l'équipe technique. 
# 📱 Système de Messages - Synchronisation Partenaires/Particuliers

## 🎯 Objectif

Ce système permet aux particuliers d'envoyer des messages aux partenaires depuis leurs vitrines, et ces messages apparaissent automatiquement dans le dashboard de messagerie du particulier.

## 🔄 Flux de fonctionnement

```
1. Particulier visite une vitrine de partenaire
2. Envoie un message via le chat de la vitrine
3. Le message est sauvegardé en base de données
4. Le message apparaît dans le dashboard du particulier
5. Le partenaire peut répondre depuis son dashboard
6. La conversation est synchronisée entre les deux interfaces
```

## 🏗️ Architecture technique

### Base de données
- **Conversation** : Table principale qui lie un client et un partenaire
- **Message** : Table des messages individuels avec expéditeur et contenu
- **User** : Table des utilisateurs (clients et partenaires)

### APIs
- **`/api/messages`** : Envoi et récupération des conversations
- **`/api/messages/[conversationId]`** : Récupération des messages d'une conversation

### Composants
- **Vitrine partenaire** : Chat intégré avec envoi de messages
- **Dashboard particulier** : Interface de messagerie complète
- **Dashboard partenaire** : Interface de gestion des conversations clients

## 🚀 Installation et configuration

### 1. Base de données
Assurez-vous que votre base de données MongoDB est à jour avec le schéma Prisma :
```bash
npx prisma db push
```

### 2. Test du système
Exécutez le script de test pour créer des données de démonstration :
```bash
npx tsx scripts/test-message-system.ts
```

### 3. Vérification
- Connectez-vous avec `test-user@example.com` (particulier)
- Allez dans Messages du dashboard
- Vous devriez voir une conversation avec "Château de Vaux-le-Vicomte"

## 💬 Utilisation

### Pour les particuliers

1. **Visiter une vitrine de partenaire**
   - Naviguez vers `/partner/[id]`
   - Utilisez le chat intégré pour poser des questions

2. **Consulter vos messages**
   - Allez dans votre dashboard → Messages
   - Toutes vos conversations avec les partenaires s'affichent
   - Cliquez sur une conversation pour voir l'historique

3. **Répondre aux partenaires**
   - Tapez votre message dans la zone de saisie
   - Appuyez sur Entrée ou cliquez sur l'icône d'envoi

### Pour les partenaires

1. **Recevoir les messages**
   - Les messages des clients apparaissent dans votre dashboard
   - Vous êtes notifié des nouveaux messages non lus

2. **Répondre aux clients**
   - Sélectionnez une conversation
   - Tapez votre réponse
   - Le client verra votre message dans son dashboard

## 🔧 Fonctionnalités

### ✅ Implémentées
- [x] Envoi de messages depuis les vitrines des partenaires
- [x] Synchronisation automatique avec le dashboard des particuliers
- [x] Interface de messagerie complète pour les particuliers
- [x] Gestion des conversations et messages en base de données
- [x] Indicateurs de messages non lus
- [x] Recherche dans les conversations
- [x] Interface responsive et moderne

### 🚧 En cours de développement
- [ ] Notifications en temps réel (WebSocket)
- [ ] Envoi de fichiers et images
- [ ] Statuts de lecture avancés
- [ ] Historique des conversations archivées

## 🐛 Dépannage

### Messages n'apparaissent pas
1. Vérifiez que l'utilisateur est connecté
2. Vérifiez les logs de l'API
3. Assurez-vous que la base de données est accessible

### Erreurs d'authentification
1. Vérifiez la configuration NextAuth
2. Assurez-vous que les sessions sont valides
3. Vérifiez les permissions des utilisateurs

### Problèmes de base de données
1. Exécutez `npx prisma db push` pour mettre à jour le schéma
2. Vérifiez la connexion MongoDB
3. Consultez les logs Prisma

## 📝 Structure des données

### Conversation
```typescript
{
  id: string
  clientId: string      // ID de l'utilisateur particulier
  partnerId: string     // ID de l'utilisateur partenaire
  lastMessageAt: Date   // Dernier message reçu
  unreadCount: number   // Nombre de messages non lus
  messages: Message[]    // Liste des messages
}
```

### Message
```typescript
{
  id: string
  content: string       // Contenu du message
  senderId: string      // ID de l'expéditeur
  conversationId: string // ID de la conversation
  createdAt: Date       // Date de création
  read: boolean         // Statut de lecture
}
```

## 🔒 Sécurité

- Authentification requise pour toutes les opérations
- Vérification des permissions (utilisateur fait partie de la conversation)
- Validation des données d'entrée
- Protection contre les injections et attaques XSS

## 📱 Interface utilisateur

### Vitrine partenaire
- Chat intégré avec historique des messages
- Indicateur d'envoi en cours
- Réponse automatique de confirmation
- Interface responsive

### Dashboard particulier
- Liste des conversations avec recherche
- Affichage des messages en temps réel
- Indicateurs de messages non lus
- Interface identique à la messagerie des particuliers

## 🎨 Personnalisation

Le système utilise les composants UI existants et respecte la charte graphique de l'application :
- Couleurs : Rose (#ec4899) pour les éléments actifs
- Typographie : Système de design cohérent
- Composants : Réutilisation des composants existants
- Responsive : Adaptation mobile et desktop

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs de l'application
2. Vérifiez la documentation Prisma
3. Testez avec le script de démonstration
4. Contactez l'équipe de développement 
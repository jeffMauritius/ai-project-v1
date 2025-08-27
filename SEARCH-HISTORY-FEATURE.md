# 📋 Fonctionnalité : Historique des recherches

## 🎯 Vue d'ensemble

La fonctionnalité **Historique des recherches** permet aux utilisateurs de consulter, gérer et reprendre leurs recherches précédentes sur la plateforme MonMariage.AI. Cette fonctionnalité améliore l'expérience utilisateur en offrant une traçabilité complète des recherches effectuées.

## ✨ Fonctionnalités principales

### 🔍 **Sauvegarde automatique**
- Chaque recherche effectuée via la barre de recherche IA est automatiquement sauvegardée
- Capture des métadonnées : requête, type de recherche, résultats trouvés
- Sauvegarde non-bloquante (la recherche continue même si la sauvegarde échoue)

### 📊 **Affichage chronologique**
- Interface timeline moderne avec icônes différenciées par type
- Affichage des résultats avec leurs statuts (Consulté, Contacté, Sauvegardé, etc.)
- **Statuts intelligents** : "Sauvegardé" automatiquement affiché pour les favoris
- Dates formatées et triées par ordre chronologique inverse

### 🗑️ **Gestion des données**
- Suppression individuelle des recherches
- Confirmation visuelle avec animations de chargement
- Messages de succès/erreur via système de toast

### 🏠 **Intégration dashboard**
- Widget "Recherches récentes" sur la page d'accueil du dashboard
- Accès rapide aux 3 dernières recherches
- Lien direct vers l'historique complet

### 💚 **Statuts intelligents**
- **Synchronisation automatique** avec les favoris
- Mise à jour en temps réel des statuts
- Indicateurs visuels avec icônes et couleurs

## 🏗️ Architecture technique

### 📊 **Modèle de données**

```prisma
model SearchHistory {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt DateTime @default(now())
  
  // Informations de la recherche
  query     String   // Requête de recherche
  type      String   // Type: "LIEU", "PRESTATAIRE"
  
  // Résultats de la recherche
  results   Json     // Array des résultats avec statuts
  
  // Relations
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("search_history")
}
```

### 🔌 **APIs**

#### `GET /api/search-history`
- Récupère l'historique des recherches de l'utilisateur connecté
- **Vérification automatique des favoris** pour afficher "Sauvegardé"
- Limite à 50 dernières recherches
- Tri par date décroissante
- Formatage des données pour l'affichage

#### `POST /api/search-history`
- Sauvegarde une nouvelle recherche
- Validation des données requises
- Association automatique à l'utilisateur connecté

#### `DELETE /api/search-history/[id]`
- Supprime une recherche spécifique
- Vérification de propriété (l'utilisateur ne peut supprimer que ses propres recherches)

#### `POST /api/search-history/update-status`
- Met à jour les statuts dans l'historique quand un favori est ajouté/supprimé
- Synchronisation en temps réel avec les favoris

### 🎣 **Hook personnalisé**

```typescript
const { 
  searchHistory, 
  loading, 
  deletingId, 
  fetchSearchHistory, 
  saveSearch, 
  deleteSearch 
} = useSearchHistory()
```

**Fonctionnalités du hook :**
- Gestion d'état centralisée
- Gestion des erreurs avec toast
- Rechargement automatique après modifications
- Sauvegarde non-bloquante

## 📱 Interface utilisateur

### 🎨 **Page d'historique complet**
- **URL :** `/dashboard/search-history`
- **Design :** Timeline verticale avec icônes
- **Actions :** Suppression individuelle avec bouton trash
- **États :** Loading, empty state, liste des recherches
- **Statuts visuels :** Badges colorés avec icônes

### 🏠 **Widget dashboard**
- **Composant :** `RecentSearches`
- **Affichage :** 3 recherches les plus récentes
- **Navigation :** Lien "Voir tout" vers l'historique complet

### 🎯 **Icônes et types**
- **Lieu :** `MapPinIcon` (icône de localisation)
- **Prestataire :** `BuildingStorefrontIcon` (icône de bâtiment)

### 🏷️ **Statuts et indicateurs visuels**
- **Consulté :** Icône œil avec couleur grise
- **Sauvegardé :** Icône cœur avec couleur verte (favoris)
- **Contacté :** Icône check avec couleur bleue
- **Rendez-vous prévu :** Icône calendrier avec couleur violette
- **Devis reçu :** Icône check avec couleur orange

## 🔄 **Intégration avec le système existant**

### 🔍 **AISearchBar**
- Sauvegarde automatique après chaque recherche réussie
- Extraction des métadonnées depuis la réponse de l'API
- Gestion d'erreur non-bloquante

### 💚 **FavoriteButton**
- **Mise à jour automatique** des statuts dans l'historique
- Synchronisation en temps réel avec les favoris
- API dédiée pour la mise à jour des statuts

### 👤 **Authentification**
- Vérification de session sur toutes les APIs
- Association automatique à l'utilisateur connecté
- Sécurité : un utilisateur ne peut voir que ses propres recherches

### 🎨 **Design System**
- Utilisation des composants UI existants (Button, Toast)
- **Nouveau composant :** `SearchResultStatus` pour les badges de statut
- Cohérence avec le thème de l'application
- Support du mode sombre

## 🚀 **Déploiement et migration**

### 📦 **Scripts disponibles**

```bash
# Mettre à jour la base de données
npx prisma db push

# Régénérer le client Prisma
npx prisma generate

# Ajouter des données d'exemple
npm run seed:search-history
```

### 🔧 **Configuration requise**
- Base de données MongoDB avec Prisma
- Système d'authentification NextAuth
- Composants UI (shadcn/ui)

## 📈 **Métriques et analytics**

### 📊 **Données collectées**
- Nombre de recherches par utilisateur
- Types de recherches les plus populaires
- Fréquence d'utilisation de l'historique
- Taux de suppression des recherches
- **Taux de conversion vers favoris**

### 🔍 **Insights possibles**
- Comportement de recherche des utilisateurs
- Préférences par type de prestataire
- Efficacité de la fonctionnalité de reprise
- **Impact des favoris sur l'engagement**

## 🔮 **Évolutions futures**

### 🎯 **Fonctionnalités prévues**
- **Recherche dans l'historique** : Filtrage et recherche textuelle
- **Export des données** : Export PDF/CSV de l'historique
- **Partage d'historique** : Partage avec d'autres utilisateurs
- **Synchronisation** : Sync entre appareils
- **Analytics avancés** : Graphiques et statistiques d'utilisation
- **Statuts personnalisés** : Possibilité d'ajouter des statuts personnalisés

### 🔧 **Améliorations techniques**
- **Pagination** : Gestion de grands volumes de données
- **Cache** : Mise en cache des données fréquemment consultées
- **Optimisation** : Indexation des requêtes fréquentes
- **Backup** : Sauvegarde automatique de l'historique
- **Webhooks** : Notifications en temps réel des changements

## 🐛 **Dépannage**

### ❌ **Problèmes courants**

1. **Erreur "Non autorisé"**
   - Vérifier que l'utilisateur est connecté
   - Vérifier la session NextAuth

2. **Données non sauvegardées**
   - Vérifier la connexion à la base de données
   - Vérifier les logs de l'API

3. **Affichage incorrect**
   - Vérifier le format des données JSON
   - Vérifier la régénération du client Prisma

4. **Statuts non mis à jour**
   - Vérifier la synchronisation avec les favoris
   - Vérifier l'API `/api/search-history/update-status`

### 🔍 **Logs utiles**
```bash
# Vérifier les données en base
npm run check:user

# Tester l'API
curl -X GET http://localhost:3000/api/search-history

# Vérifier les migrations
npx prisma db pull
```

## 📝 **Notes de développement**

- La fonctionnalité est **rétrocompatible** avec le système existant
- Les erreurs de sauvegarde n'impactent pas l'expérience utilisateur principale
- Le design suit les conventions de l'application existante
- **Synchronisation intelligente** avec les favoris pour une expérience cohérente
- Les tests unitaires et d'intégration sont recommandés pour les évolutions futures 
# CLAUDE.md

Ce fichier fournit des directives à Claude Code (claude.ai/code) lors du travail sur le code de ce dépôt.

## Vue d'ensemble du projet

Il s'agit d'une plateforme de planification de mariage Next.js 15 avec un système à double utilisateur (utilisateurs réguliers et partenaires prestataires de mariage). L'application est construite avec TypeScript, utilise MongoDB via Prisma ORM, et s'intègre avec Stripe pour les abonnements, Socket.IO pour le chat en temps réel, et Vercel Blob pour le stockage des médias.

## Commandes de développement

### Démarrage de l'application
```bash
npm run dev          # Démarre le serveur de développement avec support Socket.IO (utilise server.js)
npm run build        # Build pour la production
npm start            # Démarre le serveur de production
npm run lint         # Exécute ESLint
```

### Opérations de base de données
```bash
npm run prisma:generate    # Génère le client Prisma
npm run prisma:db:push     # Pousse les changements du schéma vers MongoDB
npm run postinstall        # Génère automatiquement le client Prisma après l'installation
```

### Scripts utilitaires
```bash
npm run get:credentials    # Récupère les identifiants de connexion depuis la base de données
npm run check:user         # Vérifie les détails d'un utilisateur
npm run check:establishment # Vérifie les détails d'un établissement
npm run check:media        # Vérifie le statut des médias/images
```

## Architecture globale

### Modèles de données principaux

L'application possède trois types d'entités principaux définis dans le schéma Prisma :

1. **Establishment** - Lieux de réception (châteaux, hôtels, salles de réception)
   - Inclut les données de localisation (latitude/longitude pour la cartographie)
   - Possède des `ReceptionSpace` et `ReceptionOptions` associés
   - Lien vers `PartnerStorefront` pour l'affichage public

2. **Partner** - Prestataires de services (traiteurs, photographes, DJs, etc.)
   - Utilise l'enum `ServiceType` (TRAITEUR, PHOTOGRAPHE, MUSIQUE, etc.)
   - Stocke les options dynamiques dans des champs JSON (`options` et `searchableOptions`)
   - Possède des zones d'intervention (villes, rayon, ou toute la France)
   - Lien vers `PartnerStorefront` pour l'affichage public

3. **PartnerStorefront** - Pages publiques pour les lieux et les partenaires
   - Polymorphique : peut référencer soit un Establishment soit un Partner
   - Contient une galerie média (relation `Media`)
   - Gère les favoris, demandes de devis et conversations

### Rôles utilisateurs et authentification

Trois rôles utilisateurs gérés via NextAuth :
- **USER** - Utilisateurs réguliers qui planifient leur mariage
- **PARTNER** - Prestataires qui gèrent leurs vitrines
- **ADMIN** - Accès administratif

L'authentification utilise :
- Fournisseur d'identifiants avec hachage de mot de passe Argon2
- Fournisseur Google OAuth
- Sessions JWT (expiration de 30 jours)
- Logique de redirection personnalisée basée sur le rôle (voir `lib/auth.ts`)

### Système d'options dynamiques

Les partenaires ont des formulaires d'options spécifiques à chaque service définis dans des fichiers JSON :
- Situés dans le répertoire `/partners-options/`
- Chaque `ServiceType` correspond à un fichier JSON spécifique (ex: `photographer-options.json`)
- Mapping géré dans `lib/options-service.ts`
- Les clés JSON utilisent la nomenclature française (ex: `lieu_reception`, `traiteur`)
- Stocké dans les champs JSON `options` et `searchableOptions` du modèle Partner

### Intégration Socket.IO

Système de chat en temps réel implémenté dans `server.js` :
- Serveur personnalisé enveloppant Next.js pour ajouter Socket.IO
- Conversations entre utilisateurs et partenaires
- Messages stockés dans MongoDB (modèles `Conversation` et `Message`)
- Compteurs de messages non lus gérés par conversation
- Chemin Socket : `/api/socketio`

### Système d'abonnement

Gestion des abonnements alimentée par Stripe :
- Trois niveaux : Essentiel, Pro, Premium
- Intervalles de facturation mensuelle/annuelle
- Stockés dans les modèles `Subscription`, `SubscriptionPlan` et `Payment`
- Gestion des webhooks pour les événements de paiement
- Intégration client via `lib/stripe.ts` et `lib/stripe-client.ts`

### Stockage des médias et images

- Stockage Vercel Blob pour toutes les images
- URLs d'images transformées via `lib/image-url-transformer.ts`
- Médias organisés via le modèle `Media` avec ordre
- Support des images Establishment et Partner

## Emplacements des fichiers clés

### Configuration
- `server.js` - Serveur personnalisé avec intégration Socket.IO
- `lib/auth.ts` - Configuration et callbacks NextAuth
- `lib/prisma.ts` - Singleton du client Prisma
- `next.config.js` - Configuration Next.js (domaines d'images, paramètres TypeScript)

### Base de données
- `prisma/schema.prisma` - Modèle de données complet avec plus de 20 modèles
- `lib/prisma.js` / `lib/prisma.ts` - Instances du client

### Services principaux
- `lib/options-service.ts` - Mappings des formulaires d'options des partenaires
- `lib/image-url-transformer.ts` - Gestion des URLs Vercel Blob
- `lib/validation-schemas.ts` - Schémas de validation Zod
- `lib/socket-server.ts` - Logique serveur Socket.IO
- `lib/stripe.ts` - Intégration Stripe côté serveur

### Structure Frontend
- `/app/page.tsx` - Page d'accueil avec recherche IA
- `/app/dashboard/*` - Tableau de bord utilisateur (planification, historique de recherche, plan de table)
- `/app/partner-dashboard/*` - Tableau de bord partenaire (vitrine, analytics, avis)
- `/app/storefront/[id]/*` - Pages de vitrine publiques
- `/components/ui/*` - Composants Radix UI avec Tailwind
- `/hooks/*` - Hooks React personnalisés (useGuests, useFavorites, useSocket, etc.)

### Routes API
- `/app/api/auth/[...nextauth]/route.ts` - Handler NextAuth
- `/app/api/stripe/*` - Paiements Stripe et webhooks
- `/app/api/partner-storefront/*` - CRUD vitrine partenaire
- `/app/api/favorites/route.ts` - Gestion des favoris utilisateur
- `/app/api/search-history/route.ts` - Suivi de l'historique de recherche

## Notes importantes de développement

### Configuration TypeScript
- Les erreurs de build sont ignorées (`typescript.ignoreBuildErrors: true`)
- Alias de chemin `@/*` résout vers la racine du projet
- Mode strict activé

### Exigence de serveur personnalisé
- **Toujours utiliser `npm run dev`** (pas `next dev`)
- Requis pour la fonctionnalité Socket.IO
- Le serveur tourne sur `http://localhost:3000`

### Considérations sur la base de données
- MongoDB avec adaptateur Prisma
- Les champs ObjectId utilisent l'annotation `@db.ObjectId`
- Suppressions en cascade configurées sur la plupart des relations
- Contraintes uniques sur les données spécifiques à l'utilisateur (favoris, invités par email)

### Variables d'environnement requises
- `DATABASE_URL` - Chaîne de connexion MongoDB
- `NEXTAUTH_SECRET` - Secret d'authentification
- `NEXTAUTH_URL` - URL de l'application
- `BLOB_READ_WRITE_TOKEN` - Token Vercel Blob
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY` - Pour les fonctionnalités IA
- `NEXT_PUBLIC_TINY_MCE_API_KEY` - Éditeur de texte riche

### Styling
- Tailwind CSS avec configuration personnalisée
- Composants Radix UI dans `/components/ui/`
- Support thème sombre/clair via `next-themes`
- Fournisseur de thème dans `app/providers.tsx`

### Gestion d'état
- React Query (TanStack Query) pour l'état serveur
- Hooks personnalisés pour la récupération de données
- Gestion de session via NextAuth
- Mises à jour en temps réel via événements Socket.IO

## Workflows courants

### Ajouter un nouveau type de service partenaire
1. Ajouter la valeur enum à `ServiceType` dans `prisma/schema.prisma`
2. Créer le fichier JSON dans `/partners-options/` (ex: `new-service-options.json`)
3. Mettre à jour les mappings dans `lib/options-service.ts`
4. Exécuter `npm run prisma:db:push`

### Travailler avec les vitrines
- Les vitrines sont polymorphiques (soit Establishment soit Partner)
- Toujours vérifier le champ `type` (VENUE ou PARTNER)
- Les médias sont ordonnés via le champ `order` du modèle Media
- Utiliser le flag `isActive` pour contrôler la visibilité publique

### Tester les requêtes de base de données
- Utiliser les scripts utilitaires : `check:user`, `check:establishment`, `check:media`
- Ou créer des scripts temporaires dans le répertoire `/scripts/`
- Exécuter avec `tsx scripts/votre-script.ts`

### Développement Socket.IO
- Logique de connexion client dans `lib/socket-client.ts`
- Événements serveur gérés dans `server.js`
- Les conversations doivent exister avant d'envoyer des messages
- Rejoindre la room avec l'événement `join-conversation` avant d'envoyer des messages

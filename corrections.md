# Journal des corrections - MonMariage.ai

## 25 Décembre 2024

### 1. Fix Partner Dashboard LIEU - Création Establishment et Géolocalisation

**Problème 1 : Interface incorrecte pour les lieux de réception**
- Les partenaires de type LIEU voyaient un formulaire d'options dynamique au lieu du formulaire spécifique aux lieux
- Cause : Pas d'Establishment créé lors de l'inscription, `establishmentId` restait null

**Solution :**
- Modification de `/app/api/register/route.ts` pour créer automatiquement un Establishment pour les partenaires LIEU
- Ajout de scripts de migration pour corriger les comptes existants (`scripts/fix-single-storefront.ts`, `scripts/fix-lieu-storefronts.ts`)
- Ajout d'une condition dans `OptionsTab.tsx` pour vérifier `establishmentId`

**Problème 2 : Type de lieu non persisté**
- Le champ "venueType" affichait toujours "UNKNOWN" après sauvegarde

**Solution :**
- Ajout de `venueType` dans les données envoyées par `StorefrontForm.tsx`
- Ajout de `venueType` dans le schéma Zod de l'API `/app/api/partner-storefront/route.ts`
- Modification de l'API PUT pour mettre à jour l'Establishment avec le venueType

**Problème 3 : Données non mises à jour sans rafraîchissement**
- Après sauvegarde des options de réception, l'utilisateur devait rafraîchir la page

**Solution :**
- Ajout d'une prop `onUpdate` au composant `ReceptionOptions.tsx`
- Appel du callback après chaque sauvegarde réussie

**Problème 4 : Géolocalisation manuelle**
- L'onglet Localisation avait un champ d'adresse séparé de l'onglet Général

**Solution :**
- Refonte de l'onglet Localisation dans `/app/partner-dashboard/storefront/page.tsx`
- Affichage en lecture seule de l'adresse depuis les champs de facturation
- Ajout du bouton "Géolocaliser l'adresse" utilisant l'API Nominatim
- Renommage des champs `venueLatitude`/`venueLongitude` en `latitude`/`longitude`

---

### 2. Mise à jour des fichiers JSON d'options partenaires

- Mise à jour des fichiers dans `/partners-options/` et `/public/partners-options/`
- Fichiers concernés : animation, caterer, decoration, video, wedding-cake, wedding-planner
- Amélioration du composant `DynamicOptionsForm.tsx`

---

### 3. Corrections de responsivité mobile

**Sidebars avec toggle mobile :**
- `/app/components/Sidebar.tsx` : Mode off-canvas sur mobile avec overlay, bouton fermer, transition animée
- `/app/partner-dashboard/components/PartnerSidebar.tsx` : Même traitement

**Navbar avec menu hamburger :**
- `/app/components/Navbar.tsx` : Ajout du bouton hamburger, liens navigation dans dropdown mobile, navbar sticky

**Layouts dashboard responsive :**
- Création de `/app/dashboard/DashboardLayoutClient.tsx` : Wrapper client pour gérer l'état du sidebar
- Création de `/app/partner-dashboard/PartnerDashboardLayoutClient.tsx`
- Modification des layouts pour utiliser padding responsive `p-4 md:p-6 lg:p-8`

**Tables avec scroll horizontal :**
- `/app/dashboard/guests/page.tsx` : Ajout de `overflow-x-auto` sur les conteneurs de tables

**Gaps et paddings responsifs :**
- `/app/storefront/[id]/page.tsx` : `gap-4 sm:gap-6 lg:gap-8`, padding `px-4 sm:px-6 lg:px-8`
- `/app/page.tsx` : Tailles de texte progressives `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`

**Largeurs fixes corrigées :**
- `/app/partner-dashboard/analytics/page.tsx` : SELECT `w-full sm:w-[180px]`, header flex responsive

**Page messages mobile :**
- `/app/dashboard/messages/page.tsx` : Vue liste/conversation alternée sur mobile, bouton retour, largeurs adaptatives

---

### 4. Bouton "Créer un compte gratuitement"

**Fichier :** `/app/components/AISearchBar.tsx`

**Modification :** Le bouton redirige maintenant vers `/auth/register` au lieu de `/auth/login`

---

### 5. Retrait de Pinterest des réseaux sociaux

**Fichier :** `/app/components/Footer.tsx`

**Modification :** Suppression de Pinterest de la liste des réseaux sociaux (reste : Instagram, Facebook, Twitter/X)

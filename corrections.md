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

---

### 6. Fix Double Navbar sur les pages Dashboard mobile

**Problème :** Sur mobile, deux barres de navigation apparaissaient sur les pages dashboard (invités, plan de table, photos, etc.)

**Cause :** Le Navbar était rendu deux fois :
1. Dans `/app/layout.tsx` (layout global)
2. Dans `DashboardLayoutClient.tsx` et `PartnerDashboardLayoutClient.tsx` (layouts dashboard)

**Solution :**
- Création de `/app/contexts/SidebarContext.tsx` : Context React pour partager l'état du sidebar entre composants
- Modification de `/app/layout.tsx` : Ajout du `SidebarProvider` autour des enfants
- Modification de `/app/components/Navbar.tsx` : Utilisation du hook `useSidebar()` au lieu des props
- Modification de `/app/components/Sidebar.tsx` : Utilisation du hook `useSidebar()` + activation automatique du bouton menu
- Modification de `/app/partner-dashboard/components/PartnerSidebar.tsx` : Même traitement
- Modification de `/app/dashboard/DashboardLayoutClient.tsx` : Suppression du Navbar en double
- Modification de `/app/partner-dashboard/PartnerDashboardLayoutClient.tsx` : Suppression du Navbar en double

**Résultat :** Un seul Navbar est maintenant affiché, avec le bouton hamburger visible uniquement sur les pages dashboard en mobile

---

### 7. Fix UI page Photos mobile

**Problème :** Sur mobile, le header de la page Photos avait les boutons mal alignés, et les modales (Nouvel album, Ajouter des photos) n'étaient pas optimisées pour mobile.

**Solution :**
- Modification de `/app/dashboard/photos/page.tsx` : Header responsive avec flex-col sur mobile et flex-row sur desktop
- Modification de `/components/ui/dialog.tsx` : Ajout de `max-h-[90vh] overflow-y-auto mx-4 sm:mx-0 rounded-lg` pour une meilleure expérience mobile

**Résultat :** Les boutons sont empilés verticalement sur mobile, et les modales ont des marges latérales et un scroll si nécessaire

---

### 8. Fix UI page Plan de table (Seating) mobile

**Problème :** Sur mobile, les deux colonnes (Invités non placés et Plan de table) étaient côte à côte et coupées.

**Solution :**
- Modification de `/app/dashboard/seating/page.tsx` :
  - Layout flex-col sur mobile, flex-row sur desktop
  - Liste des invités en pleine largeur sur mobile avec max-height de 40vh
  - Header responsive avec stats sur plusieurs lignes
  - Bouton "Ajouter une table" pleine largeur sur mobile
  - Modal d'ajout de table avec padding et boutons responsifs

**Résultat :** Sur mobile, la liste des invités apparaît en haut (avec scroll), suivie du plan de table en dessous

---

### 9. Fix UI page Invités (Guests) mobile

**Problème :** Sur mobile, le header de la page Invités avait les boutons mal alignés et coupés.

**Solution :**
- Modification de `/app/dashboard/guests/page.tsx` :
  - Header responsive avec flex-col sur mobile et flex-row sur desktop
  - Boutons empilés verticalement sur mobile avec gap-2
  - Boutons en pleine largeur sur mobile avec w-full et justify-center

**Résultat :** Les boutons sont empilés verticalement et centrés sur mobile, alignés horizontalement sur desktop

---

### 10. Fix UI page Établissements mobile

**Problème :** Sur mobile, les boutons de filtre par type étaient coupés et débordaient de l'écran.

**Solution :**
- Modification de `/app/establishments/page.tsx` :
  - Ajout de padding horizontal responsive `px-4 sm:px-6 lg:px-8`
  - Taille de titre responsive `text-2xl sm:text-3xl`
- Modification de `/components/TypeFilter.tsx` :
  - Container avec margins négatives pour scroll edge-to-edge sur mobile
  - Scroll horizontal sur mobile avec `overflow-x-auto`
  - `flex-wrap` uniquement sur desktop (`sm:flex-wrap`)
  - Badges avec `flex-shrink-0` et `whitespace-nowrap` pour éviter l'écrasement
  - Tailles de texte et padding responsives

**Résultat :** Sur mobile, les filtres sont scrollables horizontalement. Sur desktop, ils s'affichent en wrap sur plusieurs lignes

---

### 11. Fix UI page Storefront (vitrine publique) mobile

**Problème :** Sur mobile, le header avec le titre et les avis était coupé, et les boutons "Ajouter aux favoris" / "Ajouter à mon organisation" débordaient.

**Solution :**
- Modification de `/app/storefront/[id]/page.tsx` :
  - Header responsive avec flex-col sur mobile, flex-row sur desktop
  - Titre avec tailles progressives `text-xl sm:text-2xl md:text-3xl lg:text-4xl`
  - Avis alignés horizontalement sur mobile, verticalement sur desktop
  - Étoiles et textes plus petits sur mobile (`w-3 h-3 sm:w-4 sm:h-4`)
  - Boutons "favoris" et "organisation" empilés verticalement sur mobile avec `flex-col sm:flex-row`
  - Bouton "Voir tous les avis" masqué sur mobile
  - Carte Contact avec margin-top sur mobile (`mt-6 lg:mt-0`) pour ne pas recouvrir les boutons
  - Hauteur fixe de la carte Contact uniquement sur desktop (`lg:h-80`)
  - Espace d'alignement invisible masqué sur mobile (`hidden lg:block`)

**Résultat :** Sur mobile, le header est empilé verticalement, les boutons sont en pleine largeur, et la carte Contact apparaît en dessous avec un espacement correct

---

### 12. Fix menu hamburger sur pages publiques mobile

**Problème :** Sur les pages publiques (storefront, establishments, etc.), le bouton hamburger n'apparaissait pas car il était conditionné par `showMenuButton` qui n'est activé que par les sidebars des dashboards.

**Solution :**
- Modification de `/app/components/Navbar.tsx` :
  - Ajout d'un bouton hamburger alternatif pour les pages sans sidebar
  - Utilisation de l'état `isMobileMenuOpen` pour toggle le menu mobile
  - Ajout d'un menu déroulant mobile avec les liens "Lieux de mariages" et "Prestataires"
  - Le menu se ferme automatiquement lors de la navigation

**Résultat :** Sur mobile, le bouton hamburger apparaît sur toutes les pages et ouvre soit le sidebar (pages dashboard) soit un menu déroulant avec les liens de navigation (pages publiques)

---

### 13. Fix menu hamburger affichant le mauvais menu sur dashboard

**Problème :** Sur les pages dashboard mobile, le clic sur le hamburger affichait le menu public (Lieux de mariages, Prestataires) au lieu d'ouvrir la sidebar avec tous les items du dashboard.

**Cause :** La condition d'affichage du menu mobile `{isMobileMenuOpen && (...)}` ne vérifiait pas si on était sur une page dashboard.

**Solution :**
- Modification de `/app/components/Navbar.tsx` :
  - Ajout de la condition `!showMenuButton` à l'affichage du menu mobile
  - Le menu public ne s'affiche maintenant que sur les pages sans sidebar

**Résultat :** Sur mobile, le hamburger ouvre correctement la sidebar sur les pages dashboard (avec tous les items), et le menu déroulant avec les liens publics uniquement sur les pages publiques

---

### 14. Fallback pour images manquantes sur les cartes

**Problème :** Sur les pages Établissements et Prestataires, quand une image n'est pas disponible ou échoue au chargement, un espace vide apparaît à la place de l'image.

**Solution :**
- Création d'un composant réutilisable `/components/ui/ImageWithFallback.tsx` :
  - Gère l'état d'erreur de chargement d'image
  - Affiche un placeholder avec icône `ImageOff` et texte "Image non disponible"
  - Props configurables pour le style du fallback
- Modification de `/app/components/EstablishmentCard.tsx` :
  - Ajout d'un état `imageError` et handler `onError`
  - Affichage du fallback quand l'image échoue
  - Masquage des indicateurs de galerie quand l'image est en erreur
- Modification de `/app/prestataires/page.tsx` :
  - Utilisation du composant `ImageWithFallback` pour les cartes de prestataires

**Résultat :** Les cartes affichent maintenant un placeholder élégant avec une icône et un message quand l'image n'est pas disponible ou échoue au chargement

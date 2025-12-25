# SEO - MonMariage.ai

## Implémentation terminée

---

## Fichiers SEO créés/modifiés

| Élément | Fichier | Status |
|---------|---------|--------|
| robots.txt | /public/robots.txt | Fait |
| Sitemap dynamique | /app/sitemap.ts | Fait |
| Metadata globale | /app/layout.tsx | Fait |
| JSON-LD Organisation | /app/layout.tsx | Fait |
| Metadata Homepage | /app/page.tsx | Fait |
| Metadata Établissements | /app/establishments/layout.tsx | Fait |
| Metadata Prestataires | /app/prestataires/layout.tsx | Fait |
| generateMetadata Storefront | /app/storefront/[id]/page.tsx | Fait |
| JSON-LD LocalBusiness | /app/storefront/[id]/page.tsx | Fait |
| manifest.json PWA | /public/manifest.json | Fait |

---

## Fonctionnalités SEO

### robots.txt
- Autorise indexation pages publiques
- Bloque dashboard, API, auth, admin
- Référence sitemap.xml

### Sitemap dynamique
- Pages statiques avec priorités
- Storefronts actifs depuis base de données
- Fréquences de mise à jour configurées

### Metadata globale (layout.tsx)
- metadataBase configuré
- Title template (%s | MonMariage.ai)
- Description et keywords optimisés
- OpenGraph complet
- Twitter Cards
- Robots directives googleBot
- JSON-LD Organisation schema

### Metadata dynamique storefronts
- generateMetadata async
- Title : {nom} - {type} mariage {location}
- OpenGraph avec image du prestataire
- JSON-LD LocalBusiness/EventVenue

### PWA manifest
- Nom et description
- Couleur thème pink-600
- Icône logo existant
- Shortcuts vers lieux et prestataires

---

## URLs

- Production : https://monmariage.ai
- Sitemap : https://monmariage.ai/sitemap.xml
- Robots : https://monmariage.ai/robots.txt
- Manifest : https://monmariage.ai/manifest.json

---

## Prochaines étapes optionnelles

1. Créer image OG dédiée (1200x630px) - /public/og-image.jpg
2. Configurer Google Search Console
3. Soumettre sitemap à Google
4. Tester avec Rich Results Test

---

*Dernière mise à jour : 25 Décembre 2024*

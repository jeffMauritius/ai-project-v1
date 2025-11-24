# Analyse de la Recherche IA - Problèmes de Pertinence

## 🔍 Vue d'ensemble du système actuel

### Flux de recherche
1. **AISearchBar.tsx** → Envoie la requête à `/api/search`
2. **API /api/search** → Analyse avec OpenAI GPT-3.5 → Requête Prisma MongoDB
3. **Retour des résultats** → Affichage dans `/results`

---

## ❌ Problèmes identifiés

### 1. **Analyse IA limitée et peu fiable**

**Ligne 141-185 de `/app/api/search/route.ts`**

```typescript
model: 'gpt-3.5-turbo',
temperature: 0.1,
max_tokens: 500
```

**Problèmes:**
- ❌ GPT-3.5-turbo est le modèle le **moins performant** d'OpenAI
- ❌ `max_tokens: 500` limite sévèrement la réponse (très court)
- ❌ Le prompt système est trop générique et manque de contexte sur votre base de données réelle
- ❌ Pas de validation de la réponse JSON (peut planter si malformé)

**Impact:** L'IA comprend mal les requêtes complexes et produit des critères de recherche inadaptés.

---

### 2. **Requêtes MongoDB inefficaces et imprécises**

#### Pour les Establishments (lieux)

**Ligne 321-346 : Logique de filtrage défaillante**

```typescript
// Problème 1: Prend seulement le PREMIER match
for (const venueType of venueTypes) {
  const mappedType = venueTypeMapping[venueType.toLowerCase()]
  if (mappedType) {
    whereClause.type = { contains: mappedType, mode: 'insensitive' }
    break // ⚠️ BREAK = ignore les autres types demandés
  }
}
```

**Exemple concret du problème:**
- Requête: "Château avec jardin près de Paris"
- L'IA extrait: `features: ["château", "jardin"]`
- Le code prend SEULEMENT "château" et **ignore complètement "jardin"**
- Résultat: Tous les châteaux (même sans jardin)

---

**Ligne 349-362 : Recherche de localisation trop floue**

```typescript
whereClause.OR = [
  { city: { contains: analysis.location, mode: 'insensitive' } },
  { region: { contains: analysis.location, mode: 'insensitive' } },
  ...locationTerms.map(term => ({
    OR: [
      { city: { contains: term, mode: 'insensitive' } },
      { region: { contains: term, mode: 'insensitive' } }
    ]
  }))
]
```

**Problèmes:**
- ❌ Recherche "Paris" matche aussi "Paris-plage", "Parisien", etc.
- ❌ Pas de calcul de distance géographique (latitude/longitude disponibles mais non utilisés)
- ❌ "Sud de la France" ne matche rien car cherche dans city/region (qui contiennent des noms précis)

---

**Ligne 365-370 : Capacité avec tolérances arbitraires**

```typescript
if (analysis.capacity?.min) {
  whereClause.maxCapacity = { gte: Math.max(1, analysis.capacity.min - 20) } // ⚠️ Tolérance de 20
}
if (analysis.capacity?.max) {
  whereClause.maxCapacity = { ...whereClause.maxCapacity, lte: analysis.capacity.max + 50 } // ⚠️ Tolérance de 50
}
```

**Problèmes:**
- ❌ Tolérances fixes (20/50) inadaptées selon la taille
- ❌ Pour 100 invités → cherche 80-150 (trop large)
- ❌ Écrase `maxCapacity` au lieu de combiner avec AND

---

### 3. **Pas de scoring/ranking de pertinence**

**Ligne 405-427 : Simple mapping sans calcul de pertinence**

Les résultats sont retournés **dans l'ordre de la base de données**, sans aucun classement par pertinence:
- ❌ Pas de score basé sur la proximité géographique
- ❌ Pas de score basé sur le nombre de critères matchés
- ❌ Pas de boost pour les établissements populaires (rating, reviewCount)
- ❌ Pas de pénalité pour les critères non matchés

**Résultat:** Un château à 500km peut apparaître avant un château à 5km.

---

### 4. **Fallback trop simpliste**

**Ligne 218-291 : Analyse de secours basique**

En cas d'erreur OpenAI, le système utilise une détection de mots-clés **extrêmement basique**:

```typescript
if (words.some(w => ['château', 'chateau', 'auberge', ...].includes(w))) {
  serviceType.push('LIEU')
}
```

**Problèmes:**
- ❌ Détection mot à mot uniquement (pas de synonymes)
- ❌ Pas de compréhension du contexte
- ❌ Liste de villes française hardcodée (260 lignes!) mais peu utilisable

---

### 5. **Problèmes de données dans la base**

**Données manquantes ou mal structurées:**
- Les `Establishment` ont des champs comme `hasParking`, `hasTerrace` mais ne sont pas recherchés
- Les `Partner` ont `searchableOptions` (JSON) mais jamais utilisé dans la recherche
- Pas d'indexation full-text sur les descriptions
- Les images peuvent être dans `images` OU dans `Media` (incohérence)

---

## 💡 Solutions recommandées

### Solution 1: Améliorer l'analyse IA (Court terme)

```typescript
// Utiliser GPT-4 ou GPT-4-turbo
model: 'gpt-4-turbo-preview',
temperature: 0.2,
max_tokens: 1000,

// Améliorer le prompt système avec des exemples concrets
content: `Tu es un expert en recherche de prestataires de mariage.
Base de données disponible:
- ${establishmentsCount} lieux (châteaux, domaines, hôtels...)
- ${partnersCount} prestataires (photographes, traiteurs, DJs...)

Types de lieux disponibles: ${venueTypes}
Régions principales: ${topRegions}
Capacités moyennes: ${capacityRanges}

Exemple de requête:
"Je cherche un château avec jardin pour 100 personnes près de Paris"
→ {
  "serviceType": ["LIEU"],
  "location": "Paris",
  "capacity": {"min": 90, "max": 120},
  "features": ["château", "jardin"],
  "style": []
}

Analyse maintenant: ${query}`
```

### Solution 2: Implémenter un système de scoring

```typescript
interface ScoredResult extends SearchResult {
  score: number
  matchedCriteria: string[]
  missedCriteria: string[]
  distance?: number
}

function calculateRelevanceScore(result: SearchResult, criteria: SearchCriteria): number {
  let score = 0

  // +100 points pour le bon type de service
  if (criteria.serviceType.includes(result.serviceType)) score += 100

  // +50 points pour chaque feature matchée
  score += criteria.features.filter(f => result.features.includes(f)).length * 50

  // +30 points pour la proximité géographique
  if (result.latitude && result.longitude && criteria.location) {
    const distance = calculateDistance(result, criteria.location)
    if (distance < 50) score += 30
    else if (distance < 100) score += 15
  }

  // +20 points pour la capacité dans la fourchette
  if (criteria.capacity?.min && result.capacity) {
    const diff = Math.abs(result.capacity - criteria.capacity.min)
    if (diff < 10) score += 20
    else if (diff < 30) score += 10
  }

  // +10 points par étoile de rating
  if (result.rating) score += result.rating * 10

  return score
}

// Trier par score avant de retourner
results.sort((a, b) => b.score - a.score)
```

### Solution 3: Utiliser MongoDB Atlas Search (Full-text search)

MongoDB supporte la recherche full-text avec scoring automatique:

```typescript
const results = await prisma.establishment.aggregateRaw({
  pipeline: [
    {
      $search: {
        index: "establishment_search",
        compound: {
          must: [
            {
              text: {
                query: query,
                path: ["name", "description", "type"],
                fuzzy: { maxEdits: 1 }
              }
            }
          ],
          should: [
            {
              near: {
                path: "location",
                origin: { type: "Point", coordinates: [lat, lng] },
                pivot: 50000 // 50km
              }
            }
          ]
        }
      }
    },
    { $limit: 100 }
  ]
})
```

### Solution 4: Améliorer les filtres Prisma

Au lieu de prendre seulement le premier type:

```typescript
// AVANT (mauvais)
for (const venueType of venueTypes) {
  if (mappedType) {
    whereClause.type = { contains: mappedType }
    break // ❌
  }
}

// APRÈS (bon)
if (venueTypes.length > 0) {
  whereClause.OR = venueTypes.map(vt => ({
    type: { contains: venueTypeMapping[vt], mode: 'insensitive' }
  }))
}

// Ajouter les features séparément
if (criteria.features.includes('jardin')) {
  whereClause.hasGarden = true
}
if (criteria.features.includes('parking')) {
  whereClause.hasParking = true
}
```

### Solution 5: Ajouter le calcul de distance géographique

```typescript
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Filtrer par distance
if (analysis.location && userLat && userLng) {
  establishments = establishments.filter(est => {
    if (!est.latitude || !est.longitude) return true
    const distance = calculateDistance(userLat, userLng, est.latitude, est.longitude)
    return distance < 100 // 100km max
  })
}
```

---

## 📊 Ordre de priorité des corrections

### 🔴 Urgent (Impact élevé, effort moyen)
1. ✅ Implémenter le système de scoring de pertinence
2. ✅ Corriger les filtres Prisma pour utiliser OR au lieu de break
3. ✅ Ajouter le calcul de distance géographique

### 🟡 Important (Impact moyen, effort faible)
4. ✅ Améliorer le prompt OpenAI avec plus de contexte
5. ✅ Passer à GPT-4-turbo au lieu de GPT-3.5
6. ✅ Ajouter la validation JSON de la réponse IA

### 🟢 Amélioration (Impact faible, effort élevé)
7. ⚠️ Mettre en place MongoDB Atlas Search (nécessite migration)
8. ⚠️ Créer des indexes full-text sur les descriptions
9. ⚠️ Normaliser le stockage des images (soit images, soit Media, pas les deux)

---

## 🧪 Tests recommandés

Après corrections, tester avec ces requêtes:

1. **"Château avec jardin près de Paris pour 100 personnes"**
   - Doit retourner des châteaux dans l'Île-de-France en priorité
   - Avec `hasGarden = true`
   - Capacité 90-120

2. **"Photographe style reportage sud de la France"**
   - Doit retourner des photographes PHOTOGRAPHE
   - Dans les régions: PACA, Occitanie, Nouvelle-Aquitaine
   - Avec "reportage" dans options ou description

3. **"Traiteur cuisine française Lyon"**
   - Doit retourner des TRAITEUR
   - À Lyon ou proche (< 50km)
   - Avec "française" dans services ou description

4. **"Salle moderne 200 invités bordeaux"**
   - Type = salle de réception
   - Capacité min 200
   - À Bordeaux ou Gironde
   - Style moderne si disponible

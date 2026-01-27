import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Types améliorés
interface SearchResult {
  id: string
  type: 'VENUE' | 'PARTNER'
  name: string
  serviceType?: string
  venueType?: string
  location: string
  rating?: number
  price?: number
  capacity?: number
  description?: string
  features: string[]
  imageUrl?: string
  images?: string[]
  latitude?: number
  longitude?: number
  interventionRadius?: number
  score?: number // Nouveau: score de pertinence
  distance?: number // Nouveau: distance en km
  matchedCriteria?: string[] // Nouveau: critères matchés
}

interface SearchCriteria {
  serviceType: string[]
  location: string
  venueType?: string // Nouveau: type de lieu spécifique
  budget?: { min?: number; max?: number }
  capacity?: { min?: number; max?: number }
  date: string
  features: string[]
  style: string[]
  userCoordinates?: { lat: number; lng: number } // Nouveau: coordonnées utilisateur
  maxDistance?: number // Nouveau: distance maximale en km
  searchByName?: string // Nouveau: recherche par nom exact d'un lieu/prestataire
  descriptionKeywords?: string[] // Nouveau: mots-clés à rechercher dans les descriptions
}

// Mapping statique pour requêtes simples (rapidité)
const STATIC_MAPPINGS: Record<string, SearchCriteria> = {
  'château mariage': {
    serviceType: ['LIEU'],
    location: '',
    features: ['château'],
    date: '',
    style: []
  },
  'chateau mariage': {
    serviceType: ['LIEU'],
    location: '',
    features: ['château'],
    date: '',
    style: []
  },
  'auberge mariage': {
    serviceType: ['LIEU'],
    location: '',
    features: ['auberge'],
    date: '',
    style: []
  },
  'domaine mariage': {
    serviceType: ['LIEU'],
    location: '',
    features: ['domaine'],
    date: '',
    style: []
  },
  'photographe mariage': {
    serviceType: ['PHOTOGRAPHE'],
    location: '',
    features: [],
    date: '',
    style: []
  },
  'traiteur mariage': {
    serviceType: ['TRAITEUR'],
    location: '',
    features: [],
    date: '',
    style: []
  },
  'voiture mariage': {
    serviceType: ['VOITURE'],
    location: '',
    features: [],
    date: '',
    style: []
  },
  'musique mariage': {
    serviceType: ['MUSIQUE'],
    location: '',
    features: [],
    date: '',
    style: []
  },
  'décoration mariage': {
    serviceType: ['DECORATION'],
    location: '',
    features: [],
    date: '',
    style: []
  },
  'fleuriste mariage': {
    serviceType: ['FLORISTE'],
    location: '',
    features: [],
    date: '',
    style: []
  }
}

// Cache simple pour éviter les requêtes répétées
const queryCache = new Map<string, SearchCriteria>()

// Fonction pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Fonction pour obtenir les coordonnées d'une ville (mapping simplifié)
async function getCityCoordinates(cityName: string): Promise<{ lat: number; lng: number } | null> {
  const cities: Record<string, { lat: number; lng: number }> = {
    'paris': { lat: 48.8566, lng: 2.3522 },
    'lyon': { lat: 45.7640, lng: 4.8357 },
    'marseille': { lat: 43.2965, lng: 5.3698 },
    'toulouse': { lat: 43.6047, lng: 1.4442 },
    'nice': { lat: 43.7102, lng: 7.2620 },
    'nantes': { lat: 47.2184, lng: -1.5536 },
    'bordeaux': { lat: 44.8378, lng: -0.5792 },
    'lille': { lat: 50.6292, lng: 3.0573 },
    'strasbourg': { lat: 48.5734, lng: 7.7521 },
    'montpellier': { lat: 43.6108, lng: 3.8767 },
    'rennes': { lat: 48.1173, lng: -1.6778 },
    'reims': { lat: 49.2583, lng: 4.0317 },
    'dijon': { lat: 47.3220, lng: 5.0415 },
    'grenoble': { lat: 45.1885, lng: 5.7245 },
    'angers': { lat: 47.4784, lng: -0.5632 }
  }

  const cityKey = cityName.toLowerCase().trim()
  return cities[cityKey] || null
}

// Fonction de scoring de pertinence
function calculateRelevanceScore(
  result: SearchResult,
  criteria: SearchCriteria
): { score: number; matchedCriteria: string[] } {
  let score = 0
  const matchedCriteria: string[] = []

  // 1. Type de service (+100 points - critique)
  if (criteria.serviceType.includes(result.serviceType || '')) {
    score += 100
    matchedCriteria.push('type_service')
  }

  // 2. Type de lieu spécifique (+80 points pour les lieux)
  if (criteria.venueType && result.venueType) {
    if (result.venueType.toLowerCase().includes(criteria.venueType.toLowerCase())) {
      score += 80
      matchedCriteria.push('type_lieu')
    }
  }

  // 3. Features matchées (+30 points par feature)
  if (criteria.features.length > 0 && result.features.length > 0) {
    const matchedFeatures = criteria.features.filter(f =>
      result.features.some(rf => rf.toLowerCase().includes(f.toLowerCase()))
    )
    score += matchedFeatures.length * 30
    if (matchedFeatures.length > 0) {
      matchedCriteria.push(`features_${matchedFeatures.length}`)
    }
  }

  // 4. Proximité géographique (+50 points si < 50km, +25 si < 100km)
  if (result.distance !== undefined) {
    if (result.distance < 50) {
      score += 50
      matchedCriteria.push('proximite_proche')
    } else if (result.distance < 100) {
      score += 25
      matchedCriteria.push('proximite_moyenne')
    } else if (result.distance < 200) {
      score += 10
      matchedCriteria.push('proximite_region')
    }
  }

  // 5. Capacité dans la fourchette (+40 points si parfait, +20 si proche)
  if (criteria.capacity?.min && result.capacity) {
    const diff = Math.abs(result.capacity - criteria.capacity.min)
    if (diff < 10) {
      score += 40
      matchedCriteria.push('capacite_exacte')
    } else if (diff < 30) {
      score += 20
      matchedCriteria.push('capacite_proche')
    }
  }

  // 6. Budget dans la fourchette (+30 points)
  if (criteria.budget?.min && criteria.budget?.max && result.price) {
    if (result.price >= criteria.budget.min && result.price <= criteria.budget.max) {
      score += 30
      matchedCriteria.push('budget')
    }
  }

  // 7. Rating élevé (+10 points par étoile au-dessus de 4)
  if (result.rating && result.rating >= 4) {
    score += Math.floor((result.rating - 4) * 10)
    if (result.rating >= 4.5) {
      matchedCriteria.push('rating_excellent')
    }
  }

  // 8. Style (+20 points)
  if (criteria.style.length > 0 && result.description) {
    const hasStyle = criteria.style.some(s =>
      result.description?.toLowerCase().includes(s.toLowerCase())
    )
    if (hasStyle) {
      score += 20
      matchedCriteria.push('style')
    }
  }

  // 9. Mots-clés dans la description (+25 points par mot-clé trouvé)
  if (criteria.descriptionKeywords && criteria.descriptionKeywords.length > 0 && result.description) {
    const descLower = result.description.toLowerCase()
    const matchedKeywords = criteria.descriptionKeywords.filter(keyword =>
      descLower.includes(keyword.toLowerCase())
    )
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length * 25
      matchedCriteria.push(`description_${matchedKeywords.length}_keywords`)
    }
  }

  return { score, matchedCriteria }
}

async function analyzeQueryWithAI(query: string): Promise<SearchCriteria> {
  const cacheKey = query.toLowerCase().trim()
  
  // Vérifier le cache
  if (queryCache.has(cacheKey)) {
    console.log('🎯 Cache hit pour:', query)
    return queryCache.get(cacheKey)!
  }
  
  // Vérifier le mapping statique pour les requêtes simples
  if (STATIC_MAPPINGS[cacheKey]) {
    console.log('⚡ Mapping statique pour:', query)
    const result = STATIC_MAPPINGS[cacheKey]
    queryCache.set(cacheKey, result)
    return result
  }
  
  // Utiliser l'IA pour analyser le langage naturel
  console.log('🤖 Analyse IA avec GPT-4o-mini pour:', query)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en analyse de requêtes de recherche pour mariages en France.
Ton rôle est d'extraire des critères structurés depuis du langage naturel.

IMPORTANT - RECHERCHE PAR NOM :
Si l'utilisateur mentionne un NOM PROPRE spécifique d'un lieu ou prestataire (comme "Abbaye Royale du Moncel", "Château de Versailles", "Domaine de la Roseraie", etc.), tu DOIS extraire ce nom dans le champ "searchByName".
Indices qu'il s'agit d'un nom propre :
- Mots avec majuscules (Abbaye, Château de X, Domaine de Y)
- Utilisation de "je recherche" suivi d'un nom spécifique
- Le nom contient des articles comme "du", "de la", "des" avec des mots capitalisés
- Le nom ressemble à un lieu unique et non à une catégorie générique

Exemple: "je recherche Abbaye Royale du Moncel" → searchByName: "Abbaye Royale du Moncel"
Exemple: "je recherche un château" → PAS de searchByName, c'est une catégorie

TYPES DE SERVICES disponibles (peut en avoir plusieurs si demandés) :
- LIEU : château, domaine, auberge, hôtel, restaurant, salle, bateau, manoir, propriété, mas, ferme, grange
- TRAITEUR : cuisine, repas, buffet, cocktail, menu, gastronomie
- PHOTOGRAPHE : photo, reportage, shooting, photographie
- VOITURE : transport, limousine, bus, automobile, véhicule, voiture ancienne
- MUSIQUE : dj, orchestre, groupe, musicien, band, jazz, classique
- DECORATION : déco, décorateur, décoration florale, aménagement
- FLORISTE : fleurs, bouquet, composition florale, fleuriste
- VIDEO : vidéaste, film, montage vidéo, réalisateur
- ANIMATION : magicien, spectacle, entertaineur, divertissement
- WEDDING_CAKE : gâteau, pâtisserie, wedding cake, pièce montée
- OFFICIANT : cérémonie laïque, célébrant

IMPORTANT POUR REQUÊTES MULTI-SERVICES :
- Si l'utilisateur demande plusieurs types de services (ex: "château, fleuriste et traiteur"), retourne TOUS les types dans le tableau serviceType
- Exemple: "château, fleuriste et traiteur près de Lyon" → serviceType: ["LIEU", "FLORISTE", "TRAITEUR"]

TYPES DE LIEUX spécifiques (pour venueType) :
château, domaine, auberge, hôtel, restaurant, salle, bateau, manoir, propriété, mas, ferme, grange

CARACTÉRISTIQUES pour les LIEUX (features) :
- Aménagements : jardin, terrasse, parking, piscine, parc
- Services : cuisine, hébergement, traiteur
- Style : champêtre, moderne, historique, rustique

LOCALISATIONS :
- Villes : Paris, Lyon, Marseille, Bordeaux, Toulouse, Nice, Nantes, Strasbourg, Montpellier, Lille, Rennes, Reims, etc.
- Régions : Île-de-France, Provence, Bretagne, Normandie, Aquitaine, Bourgogne, Alsace, etc.
- Zones : "sud de la france", "nord", "côte d'azur", "val de loire", etc.

STYLES possibles :
champêtre, moderne, vintage, bohème, classique, romantique, industriel, rustique, élégant, chic

MOTS-CLÉS POUR DESCRIPTION (descriptionKeywords) :
Extrais les mots-clés importants de la requête qui devraient être recherchés dans les descriptions des lieux/prestataires.
Exemples de mots-clés à extraire :
- Ambiance/atmosphère : "intimiste", "convivial", "luxueux", "authentique", "pittoresque"
- Caractéristiques : "vue mer", "vue montagne", "piscine", "cave", "vignoble", "forêt"
- Style de cuisine : "gastronomique", "bistronomique", "végétarien", "local", "terroir"
- Spécialités : "fruits de mer", "gibier", "bio", "fait maison"
- Activités : "cérémonie laïque", "vin d'honneur", "brunch"
- Autres : tout mot spécifique qui ne rentre pas dans les autres catégories

CAPACITÉS :
- Ajoute une tolérance de ±10% autour du nombre mentionné
- Si "100 personnes" → {"min": 90, "max": 120}
- Si "petit comité" → {"min": 20, "max": 50}
- Si "grand mariage" → {"min": 150, "max": 300}

DISTANCE MAXIMALE :
- Détecte les phrases comme "à moins de X km", "dans un rayon de X km", "à proximité" (50km), "près de" (50km)
- Exemples :
  * "à moins de 50 km de Lyon" → maxDistance: 50
  * "dans un rayon de 30 km" → maxDistance: 30
  * "près de Paris" → maxDistance: 50
  * "à proximité de Bordeaux" → maxDistance: 50

INSTRUCTIONS D'EXTRACTION :
1. Identifie TOUS les TYPES DE SERVICES demandés (peut être plusieurs : lieu + traiteur, etc.)
2. Extrait le TYPE DE LIEU spécifique si LIEU demandé (château, domaine, auberge, etc.)
3. Détecte la LOCALISATION précise (ville) ou zone géographique
4. Extrait la DISTANCE MAXIMALE si mentionnée (en km) - "autour de", "rayon de", "à moins de"
5. Liste les FEATURES/CARACTÉRISTIQUES demandées (jardin, parking, etc.)
6. Identifie le STYLE si mentionné
7. Extrait la CAPACITÉ avec tolérance ±10% si mentionnée (50 invités → min: 45, max: 60)
8. Détecte le BUDGET si mentionné
9. Extrait les MOTS-CLÉS pour recherche dans les descriptions (descriptionKeywords)

Réponds UNIQUEMENT avec ce JSON (pas de texte avant/après) :
{
  "serviceType": ["LIEU"],
  "location": "paris",
  "venueType": "château",
  "maxDistance": 50,
  "features": ["jardin", "parking"],
  "style": ["champêtre"],
  "capacity": {"min": 90, "max": 120},
  "budget": {"min": 5000, "max": 15000},
  "searchByName": null,
  "descriptionKeywords": ["vue", "romantique", "intimiste"]
}

EXEMPLE RECHERCHE PAR NOM :
Requête : "je recherche Abbaye Royale du Moncel"
→ {
  "serviceType": ["LIEU"],
  "searchByName": "Abbaye Royale du Moncel"
}

Requête : "je cherche le Domaine de la Bergerie"
→ {
  "serviceType": ["LIEU"],
  "searchByName": "Domaine de la Bergerie"
}

EXEMPLES :

Requête : "Château avec jardin près de Paris pour 100 personnes"
→ {
  "serviceType": ["LIEU"],
  "location": "paris",
  "venueType": "château",
  "maxDistance": 50,
  "features": ["jardin"],
  "capacity": {"min": 90, "max": 120},
  "descriptionKeywords": []
}

Requête : "Château à moins de 50 km de Lyon"
→ {
  "serviceType": ["LIEU"],
  "location": "lyon",
  "venueType": "château",
  "maxDistance": 50
}

Requête : "Photographe style reportage sud de la France"
→ {
  "serviceType": ["PHOTOGRAPHE"],
  "location": "sud de la france",
  "style": ["reportage"],
  "descriptionKeywords": ["reportage", "naturel", "spontané"]
}

Requête : "Domaine avec vue sur la mer et ambiance romantique en Bretagne"
→ {
  "serviceType": ["LIEU"],
  "location": "bretagne",
  "venueType": "domaine",
  "features": [],
  "style": ["romantique"],
  "descriptionKeywords": ["vue mer", "romantique", "océan", "bord de mer"]
}

Requête : "Traiteur cuisine gastronomique et bio près de Lyon"
→ {
  "serviceType": ["TRAITEUR"],
  "location": "lyon",
  "maxDistance": 50,
  "descriptionKeywords": ["gastronomique", "bio", "local", "terroir", "fait maison"]
}

Requête : "Domaine champêtre Bordeaux 150 invités avec hébergement dans un rayon de 30km"
→ {
  "serviceType": ["LIEU"],
  "location": "bordeaux",
  "venueType": "domaine",
  "maxDistance": 30,
  "features": ["hébergement"],
  "style": ["champêtre"],
  "capacity": {"min": 135, "max": 165}
}

Requête : "Salle moderne Lyon 200 personnes budget 10000"
→ {
  "serviceType": ["LIEU"],
  "location": "lyon",
  "venueType": "salle",
  "style": ["moderne"],
  "capacity": {"min": 180, "max": 220},
  "budget": {"min": 8000, "max": 12000}
}

Requête : "château, fleuriste et traiteur près de Lyon dans un rayon de 50 km"
→ {
  "serviceType": ["LIEU", "FLORISTE", "TRAITEUR"],
  "location": "lyon",
  "venueType": "château",
  "maxDistance": 50
}

Requête : "Je cherche un photographe et un vidéaste à Paris"
→ {
  "serviceType": ["PHOTOGRAPHE", "VIDEO"],
  "location": "paris",
  "maxDistance": 50
}

Requête : "je recherche une auberge pouvant accueillir mes 50 invités dans un rayon de 50 kilomètres autour de Lyon ainsi qu'un traiteur"
→ {
  "serviceType": ["LIEU", "TRAITEUR"],
  "location": "lyon",
  "venueType": "auberge",
  "maxDistance": 50,
  "capacity": {"min": 45, "max": 60}
}

Requête : "château pour 100 personnes près de Bordeaux avec un fleuriste et un photographe"
→ {
  "serviceType": ["LIEU", "FLORISTE", "PHOTOGRAPHE"],
  "location": "bordeaux",
  "venueType": "château",
  "maxDistance": 50,
  "capacity": {"min": 90, "max": 120}
}

Maintenant analyse cette requête :`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from GPT-4o-mini')
    }

    console.log('🤖 Réponse GPT-4o-mini brute:', aiResponse)

    // Parser la réponse JSON
    const parsed = JSON.parse(aiResponse)

    // Obtenir les coordonnées si une localisation est spécifiée
    let userCoordinates = undefined
    if (parsed.location) {
      userCoordinates = await getCityCoordinates(parsed.location)
      if (userCoordinates) {
        console.log(`📍 Coordonnées trouvées pour ${parsed.location}:`, userCoordinates)
      }
    }

    const result: SearchCriteria = {
      serviceType: parsed.serviceType || ['LIEU'],
      location: parsed.location || '',
      venueType: parsed.venueType || undefined,
      budget: parsed.budget || undefined,
      capacity: parsed.capacity || undefined,
      date: parsed.date || '',
      features: parsed.features || [],
      style: parsed.style || [],
      userCoordinates: userCoordinates ?? undefined,
      maxDistance: parsed.maxDistance || undefined,
      searchByName: parsed.searchByName || undefined,
      descriptionKeywords: parsed.descriptionKeywords || []
    }

    queryCache.set(cacheKey, result)
    console.log('✅ Analyse GPT-4o-mini complète:', result)
    return result
    
  } catch (error) {
    console.error('❌ Erreur analyse IA:', error)
    
    // Fallback : analyse simple par mots-clés
    const words = query.toLowerCase().split(' ')
    const serviceType: string[] = []
    const features: string[] = []
    let location = ''
    
    // Détection des types de service
    if (words.some(w => ['château', 'chateau', 'auberge', 'domaine', 'hôtel', 'hotel', 'restaurant', 'salle', 'bateau'].includes(w))) {
      serviceType.push('LIEU')
      
      // Extraire les features spécifiques
      if (words.some(w => ['château', 'chateau'].includes(w))) features.push('château')
      if (words.some(w => ['auberge'].includes(w))) features.push('auberge')
      if (words.some(w => ['domaine'].includes(w))) features.push('domaine')
      if (words.some(w => ['hôtel', 'hotel'].includes(w))) features.push('hôtel')
      if (words.some(w => ['restaurant'].includes(w))) features.push('restaurant')
      if (words.some(w => ['salle'].includes(w))) features.push('salle')
      if (words.some(w => ['bateau'].includes(w))) features.push('bateau')
    }
    if (words.some(w => ['photographe', 'photo'].includes(w))) {
      serviceType.push('PHOTOGRAPHE')
    }
    if (words.some(w => ['traiteur', 'cuisine'].includes(w))) {
      serviceType.push('TRAITEUR')
    }
    if (words.some(w => ['voiture', 'limousine', 'bus'].includes(w))) {
      serviceType.push('VOITURE')
    }
    if (words.some(w => ['musique', 'dj', 'orchestre'].includes(w))) {
      serviceType.push('MUSIQUE')
    }
    if (words.some(w => ['décoration', 'decoration', 'déco'].includes(w))) {
      serviceType.push('DECORATION')
    }
    if (words.some(w => ['fleuriste', 'fleurs'].includes(w))) {
      serviceType.push('FLORISTE')
    }
    
    // Détection de la localisation
    const locationWords = ['sud', 'nord', 'est', 'ouest', 'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'strasbourg', 'montpellier', 'bordeaux', 'lille', 'rennes', 'reims', 'saint-étienne', 'le havre', 'toulon', 'grenoble', 'dijon', 'angers', 'nîmes', 'villeurbanne', 'saint-denis', 'le mans', 'aix-en-provence', 'clermont-ferrand', 'brest', 'tours', 'limoges', 'amiens', 'perpignan', 'metz', 'besançon', 'boulogne-billancourt', 'orléans', 'mulhouse', 'rouen', 'caen', 'nancy', 'saint-pierre', 'argenteuil', 'montreuil', 'roubaix', 'dunkerque', 'nîmes', 'avignon', 'créteil', 'dunkerque', 'poitiers', 'fort-de-france', 'courbevoie', 'vitry-sur-seine', 'colombes', 'aulnay-sous-bois', 'asnières-sur-seine', 'rueil-malmaison', 'saint-maur-des-fossés', 'aubervilliers', 'champigny-sur-marne', 'antony', 'cannes', 'le tampon', 'boulogne-sur-mer', 'calais', 'colmar', 'issy-les-moulineaux', 'noisy-le-grand', 'levallois-perret', 'la courneuve', 'neuilly-sur-seine', 'valence', 'cergy', 'pessac', 'troyes', 'clichy', 'ivry-sur-seine', 'cholet', 'levallois-perret', 'montrouge', 'sarcelles', 'niort', 'villejuif', 'hyères', 'saint-ouen', 'saint-germain-en-laye', 'pantin', 'lorient', 'massy', 'meudon', 'blois', 'bondy', 'le blanc-mesnil', 'martigues', 'bayonne', 'cagnes-sur-mer', 'sète', 'mérignac', 'livry-gargan', 'meaux', 'saint-priest', 'saint-laurent-du-var', 'saint-chamond', 'saint-brieuc', 'saint-malo', 'saint-nazaire', 'saint-quentin', 'saint-raphaël', 'saint-denis', 'saint-ouen', 'saint-germain-en-laye', 'saint-priest', 'saint-laurent-du-var', 'saint-chamond', 'saint-brieuc', 'saint-malo', 'saint-nazaire', 'saint-quentin', 'saint-raphaël']
    
    for (const word of words) {
      if (locationWords.includes(word)) {
        location = word
        break
      }
    }
    
    // Détection des features
    if (words.includes('château') || words.includes('chateau')) {
      features.push('château')
    }
    if (words.includes('auberge')) {
      features.push('auberge')
    }
    if (words.includes('domaine')) {
      features.push('domaine')
    }
    
    // Extraction des mots-clés pour la description (fallback)
    const descriptionKeywords: string[] = []
    const keywordPatterns = [
      'vue', 'mer', 'montagne', 'lac', 'forêt', 'vignoble', 'campagne',
      'romantique', 'intimiste', 'luxueux', 'authentique', 'pittoresque', 'convivial',
      'gastronomique', 'bistronomique', 'bio', 'local', 'terroir', 'fait maison',
      'piscine', 'spa', 'cave', 'bibliothèque', 'cheminée',
      'cérémonie', 'cocktail', 'brunch', 'réception'
    ]
    for (const pattern of keywordPatterns) {
      if (query.toLowerCase().includes(pattern)) {
        descriptionKeywords.push(pattern)
      }
    }

    const result: SearchCriteria = {
      serviceType: serviceType.length > 0 ? serviceType : ['LIEU'],
      location,
      features,
      date: '',
      style: [],
      descriptionKeywords
    }

    queryCache.set(cacheKey, result)
    console.log('🔍 Analyse fallback pour:', query, '→', result)
    return result
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, offset = 0, limit = 20 } = await request.json()
    console.log('🔍 Recherche:', query, `offset: ${offset}, limit: ${limit}`)

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // 1. Analyser la requête avec IA pour comprendre le langage naturel
    const analysis = await analyzeQueryWithAI(query)
    console.log('📊 Analyse:', analysis)

    let results: SearchResult[] = []

    // 2. Recherche par nom spécifique (prioritaire)
    if (analysis.searchByName) {
      console.log('🔍 Recherche par nom:', analysis.searchByName)

      // Rechercher dans les établissements
      const establishmentsByName = await prisma.establishment.findMany({
        where: {
          name: { contains: analysis.searchByName, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          city: true,
          region: true,
          type: true,
          rating: true,
          startingPrice: true,
          maxCapacity: true,
          description: true,
          images: true,
          latitude: true,
          longitude: true,
          hasParking: true,
          hasGarden: true,
          hasTerrace: true,
          hasKitchen: true,
          hasAccommodation: true,
          storefronts: {
            select: { id: true },
            take: 1
          }
        },
        take: 50
      })

      console.log(`🏰 ${establishmentsByName.length} établissements trouvés par nom`)

      // Mapper les résultats
      for (const establishment of establishmentsByName) {
        results.push({
          id: establishment.storefronts[0]?.id || establishment.id,
          type: 'VENUE' as const,
          name: establishment.name,
          serviceType: 'LIEU',
          venueType: establishment.type,
          location: `${establishment.city}, ${establishment.region}`,
          rating: establishment.rating,
          price: establishment.startingPrice,
          capacity: establishment.maxCapacity,
          description: establishment.description,
          features: [
            establishment.type?.toLowerCase() || '',
            establishment.hasParking ? 'parking' : '',
            establishment.hasGarden ? 'jardin' : '',
            establishment.hasTerrace ? 'terrasse' : '',
            establishment.hasKitchen ? 'cuisine' : '',
            establishment.hasAccommodation ? 'hébergement' : ''
          ].filter(Boolean),
          imageUrl: establishment.images?.[0],
          images: establishment.images || [],
          latitude: establishment.latitude ?? undefined,
          longitude: establishment.longitude ?? undefined,
          score: 1000, // Score maximal pour recherche par nom
          matchedCriteria: ['nom_exact']
        })
      }

      // Rechercher aussi dans les partenaires
      const partnersByName = await prisma.partner.findMany({
        where: {
          companyName: { contains: analysis.searchByName, mode: 'insensitive' }
        },
        select: {
          id: true,
          companyName: true,
          serviceType: true,
          billingCity: true,
          basePrice: true,
          maxCapacity: true,
          description: true,
          services: true,
          images: true,
          latitude: true,
          longitude: true,
          interventionRadius: true,
          storefronts: {
            take: 1,
            select: {
              id: true,
              images: true,
              media: {
                take: 1,
                select: { url: true, type: true }
              }
            }
          }
        },
        take: 50
      })

      console.log(`👨‍💼 ${partnersByName.length} partenaires trouvés par nom`)

      for (const partner of partnersByName) {
        const bestStorefront = partner.storefronts[0]
        let imageUrl = undefined

        if (bestStorefront?.images && bestStorefront.images.length > 0) {
          imageUrl = bestStorefront.images[0]
        } else if (bestStorefront?.media && bestStorefront.media.length > 0) {
          const firstImage = bestStorefront.media.find(media => media.type === 'IMAGE')
          if (firstImage) imageUrl = firstImage.url
        }
        if (!imageUrl && partner.images && partner.images.length > 0) {
          imageUrl = partner.images[0]
        }

        results.push({
          id: bestStorefront?.id || partner.id,
          type: 'PARTNER' as const,
          name: partner.companyName,
          serviceType: partner.serviceType,
          location: `${partner.billingCity || ''}, France`,
          rating: 4.5,
          price: partner.basePrice ?? undefined,
          capacity: partner.maxCapacity ?? undefined,
          description: partner.description ?? undefined,
          features: partner.services || [],
          imageUrl,
          images: partner.images || bestStorefront?.images || [],
          latitude: partner.latitude ?? undefined,
          longitude: partner.longitude ?? undefined,
          interventionRadius: partner.interventionRadius ?? undefined,
          score: 1000,
          matchedCriteria: ['nom_exact']
        })
      }

      // Si on trouve des résultats par nom, on skip la recherche normale
      if (results.length > 0) {
        console.log(`✅ ${results.length} résultats trouvés par nom, skip recherche classique`)

        // Pagination
        const paginatedResults = results.slice(offset, offset + limit)
        const hasMore = offset + limit < results.length

        return NextResponse.json({
          results: paginatedResults,
          criteria: analysis,
          total: results.length,
          hasMore,
          offset,
          limit
        })
      }

      console.log('⚠️ Aucun résultat par nom, fallback sur recherche classique')
    }

    // 3. Recherche dans les établissements (si LIEU demandé)
    if (analysis.serviceType.includes('LIEU')) {
      console.log('🏰 Recherche établissements...')

      // Construire les filtres AND
      const andFilters: any[] = []

      // 1. Filtrage par type de lieu spécifique (venueType de l'IA)
      if (analysis.venueType) {
        const venueTypeMapping: Record<string, string> = {
          'château': 'château',
          'chateau': 'château',
          'auberge': 'auberge',
          'domaine': 'domaine',
          'salle': 'salle',
          'restaurant': 'restaurant',
          'hôtel': 'hôtel',
          'hotel': 'hôtel',
          'bateau': 'bateau',
          'manoir': 'manoir',
          'propriété': 'propriété',
          'mas': 'mas',
          'ferme': 'ferme',
          'grange': 'grange'
        }

        const mappedType = venueTypeMapping[analysis.venueType.toLowerCase()]
        if (mappedType) {
          andFilters.push({
            type: { contains: mappedType, mode: 'insensitive' as const }
          })
          console.log(`🏰 Filtre type de lieu: ${mappedType}`)
        }
      }

      // 2. Filtrage par caractéristiques (features) - utiliser les champs boolean
      if (analysis.features.length > 0) {
        for (const feature of analysis.features) {
          const featureLower = feature.toLowerCase()
          if (featureLower.includes('jardin') || featureLower.includes('garden')) {
            andFilters.push({ hasGarden: true })
            console.log('🌳 Filtre: jardin requis')
          }
          if (featureLower.includes('parking')) {
            andFilters.push({ hasParking: true })
            console.log('🚗 Filtre: parking requis')
          }
          if (featureLower.includes('terrasse') || featureLower.includes('terrace')) {
            andFilters.push({ hasTerrace: true })
            console.log('☀️ Filtre: terrasse requise')
          }
          if (featureLower.includes('cuisine') || featureLower.includes('kitchen')) {
            andFilters.push({ hasKitchen: true })
            console.log('👨‍🍳 Filtre: cuisine requise')
          }
          if (featureLower.includes('hébergement') || featureLower.includes('accommodation') || featureLower.includes('hebergement')) {
            andFilters.push({ hasAccommodation: true })
            console.log('🏨 Filtre: hébergement requis')
          }
        }
      }

      // 3. Filtrage par capacité - le lieu doit pouvoir accueillir AU MOINS le nombre demandé
      if (analysis.capacity?.min) {
        // On veut des lieux qui peuvent accueillir au moins le nombre minimum demandé
        andFilters.push({ maxCapacity: { gte: analysis.capacity.min } })
        console.log(`👥 Filtre capacité: peut accueillir au moins ${analysis.capacity.min} personnes`)
      }

      // 4. Mots-clés dans la description : pas de filtrage strict, uniquement scoring
      // Les mots-clés sont utilisés pour booster le score des résultats pertinents
      // mais ne filtrent pas (trop restrictif sinon)
      if (analysis.descriptionKeywords && analysis.descriptionKeywords.length > 0) {
        console.log(`📝 Mots-clés description à scorer: [${analysis.descriptionKeywords.join(', ')}]`)
      }

      // 5. Filtrage par localisation - toujours filtrer par région pour réduire les résultats
      // Même avec des coordonnées, on filtre par région pour avoir des résultats pertinents
      if (analysis.location) {
        const locationTerms = analysis.location.toLowerCase().split(' ')

        // Mapping des villes vers les départements proches (noms utilisés dans la DB)
        const cityToRegions: Record<string, string[]> = {
          'lyon': ['Rhône', 'Ain', 'Isère', 'Loire', 'Savoie', 'Haute-Savoie', 'Drôme', 'Ardèche'],
          'paris': ['Paris', 'Seine-et-Marne', 'Yvelines', 'Essonne', 'Hauts-de-Seine', 'Seine-Saint-Denis', 'Val-de-Marne', 'Val-d\'Oise', 'Oise'],
          'marseille': ['Bouches-du-Rhône', 'Var', 'Vaucluse', 'Alpes-de-Haute-Provence'],
          'bordeaux': ['Gironde', 'Dordogne', 'Lot-et-Garonne', 'Landes', 'Charente-Maritime'],
          'toulouse': ['Haute-Garonne', 'Tarn', 'Gers', 'Ariège', 'Aude'],
          'nice': ['Alpes-Maritimes', 'Var', 'Alpes-de-Haute-Provence'],
          'nantes': ['Loire Atlantique', 'Loire-Atlantique', 'Vendée', 'Maine et Loire', 'Maine-et-Loire', 'Morbihan'],
          'strasbourg': ['Bas-Rhin', 'Haut Rhin', 'Haut-Rhin', 'Moselle'],
          'montpellier': ['Hérault', 'Gard', 'Aude', 'Aveyron'],
          'lille': ['Nord', 'Pas-de-Calais', 'Somme', 'Aisne']
        }

        const regions = cityToRegions[analysis.location.toLowerCase()] || []

        andFilters.push({
          OR: [
            { city: { contains: analysis.location, mode: 'insensitive' as const } },
            { region: { contains: analysis.location, mode: 'insensitive' as const } },
            // Ajouter les régions associées à la ville
            ...regions.map(region => ({
              region: { contains: region, mode: 'insensitive' as const }
            })),
            ...locationTerms.map(term => ({
              OR: [
                { city: { contains: term, mode: 'insensitive' as const } },
                { region: { contains: term, mode: 'insensitive' as const } }
              ]
            }))
          ]
        })
        console.log(`📍 Filtre localisation: ${analysis.location} + régions: ${regions.join(', ')}`)
      }

      const whereClause = andFilters.length > 0 ? { AND: andFilters } : {}

      console.log('🔍 Filtres Prisma appliqués:', JSON.stringify(whereClause, null, 2))
      
      const establishments = await prisma.establishment.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          city: true,
          region: true,
          type: true,
          rating: true,
          startingPrice: true,
          maxCapacity: true,
          description: true,
          images: true,
          latitude: true,
          longitude: true,
          hasParking: true,
          hasGarden: true,
          hasTerrace: true,
          hasKitchen: true,
          hasAccommodation: true,
          storefronts: {
            select: {
              id: true
            },
            take: 1
          }
        },
        take: 2000
      })

      console.log(`🏰 ${establishments.length} établissements trouvés avant scoring`)

      // Mapper les résultats et calculer les distances
      const establishmentResults: SearchResult[] = establishments.map(establishment => {
        const result: SearchResult = {
          id: establishment.storefronts[0]?.id || establishment.id,
          type: 'VENUE' as const,
          name: establishment.name,
          serviceType: 'LIEU',
          venueType: establishment.type,
          location: `${establishment.city}, ${establishment.region}`,
          rating: establishment.rating,
          price: establishment.startingPrice,
          capacity: establishment.maxCapacity,
          description: establishment.description,
          features: [
            establishment.type?.toLowerCase() || '',
            establishment.hasParking ? 'parking' : '',
            establishment.hasGarden ? 'jardin' : '',
            establishment.hasTerrace ? 'terrasse' : '',
            establishment.hasKitchen ? 'cuisine' : '',
            establishment.hasAccommodation ? 'hébergement' : ''
          ].filter(Boolean),
          imageUrl: establishment.images?.[0],
          images: establishment.images || [],
          latitude: establishment.latitude ?? undefined,
          longitude: establishment.longitude ?? undefined
        }

        // Calculer la distance si coordonnées disponibles
        if (analysis.userCoordinates && establishment.latitude && establishment.longitude) {
          result.distance = calculateDistance(
            analysis.userCoordinates.lat,
            analysis.userCoordinates.lng,
            establishment.latitude,
            establishment.longitude
          )
        }

        // Calculer le score de pertinence
        const { score, matchedCriteria } = calculateRelevanceScore(result, analysis)
        result.score = score
        result.matchedCriteria = matchedCriteria

        return result
      })

      results.push(...establishmentResults)
    }

    // 4. Recherche dans les partenaires (si autres types demandés)
    const partnerTypes = analysis.serviceType.filter(type => type !== 'LIEU')
    if (partnerTypes.length > 0) {
      console.log('👨‍💼 Recherche partenaires:', partnerTypes)
      
      // Mapping des villes vers leurs régions
      const cityToRegionsForPartners: Record<string, string[]> = {
        'lyon': ['Lyon', 'Villeurbanne', 'Vénissieux', 'Saint-Étienne', 'Vienne', 'Bourgoin'],
        'paris': ['Paris', 'Boulogne', 'Saint-Denis', 'Montreuil', 'Nanterre', 'Versailles'],
        'marseille': ['Marseille', 'Aix-en-Provence', 'Aubagne', 'Martigues'],
        'bordeaux': ['Bordeaux', 'Mérignac', 'Pessac', 'Talence'],
        'toulouse': ['Toulouse', 'Blagnac', 'Colomiers', 'Tournefeuille'],
        'nice': ['Nice', 'Cannes', 'Antibes', 'Grasse'],
        'nantes': ['Nantes', 'Saint-Nazaire', 'Rezé', 'Saint-Herblain'],
        'strasbourg': ['Strasbourg', 'Schiltigheim', 'Illkirch', 'Haguenau'],
        'montpellier': ['Montpellier', 'Béziers', 'Sète', 'Lunel'],
        'lille': ['Lille', 'Roubaix', 'Tourcoing', 'Villeneuve']
      }

      const nearbyPartnerCities = analysis.location ? (cityToRegionsForPartners[analysis.location.toLowerCase()] || [analysis.location]) : []

      // Construire les conditions pour les partenaires
      // NOTE: On n'applique PAS le filtre de capacité aux partenaires car :
      // - Les traiteurs, photographes, etc. n'ont généralement pas de limite de capacité
      // - maxCapacity est principalement utilisé pour les lieux de réception
      // - La plupart des partenaires ont maxCapacity: null
      const partnerWhereConditions: any = {
        serviceType: { in: partnerTypes }
      }

      // Filtrage par localisation - inclure ceux de la région ou qui interviennent partout
      if (analysis.location) {
        partnerWhereConditions.OR = [
          { billingCity: { contains: analysis.location, mode: 'insensitive' } },
          ...nearbyPartnerCities.map(city => ({
            billingCity: { contains: city, mode: 'insensitive' as const }
          })),
          { interventionType: 'all_france' } // Inclure ceux qui interviennent partout
        ]
      }

      // Mots-clés description : pas de filtrage, uniquement scoring (voir calculateRelevanceScore)
      if (analysis.descriptionKeywords && analysis.descriptionKeywords.length > 0) {
        console.log(`📝 Mots-clés description partenaires à scorer: [${analysis.descriptionKeywords.join(', ')}]`)
      }

      console.log('🔍 Filtres partenaires:', JSON.stringify(partnerWhereConditions, null, 2))

      const partners = await prisma.partner.findMany({
        where: partnerWhereConditions,
        select: {
          id: true,
          companyName: true,
          serviceType: true,
          billingCity: true,
          basePrice: true,
          maxCapacity: true,
          description: true,
          services: true,
          images: true,
          latitude: true,
          longitude: true,
          interventionRadius: true,
          storefronts: {
            take: 1,
            select: {
              id: true,
              images: true,
              media: {
                take: 1,
                select: {
                  url: true,
                  type: true
                }
              }
            }
          }
        },
        take: 1000
      })
      
      console.log(`👨‍💼 ${partners.length} partenaires trouvés avant scoring`)

      // Mapper les partenaires avec scoring et distance
      const partnerResults: SearchResult[] = partners.map(partner => {
        const bestStorefront = partner.storefronts[0]
        let imageUrl = undefined

        if (bestStorefront?.images && bestStorefront.images.length > 0) {
          imageUrl = bestStorefront.images[0]
        } else if (bestStorefront?.media && bestStorefront.media.length > 0) {
          const firstImage = bestStorefront.media.find(media => media.type === 'IMAGE')
          if (firstImage) {
            imageUrl = firstImage.url
          }
        }

        // Utiliser les images du partenaire si pas d'images storefront
        if (!imageUrl && partner.images && partner.images.length > 0) {
          imageUrl = partner.images[0]
        }

        const result: SearchResult = {
          id: bestStorefront?.id || partner.id,
          type: 'PARTNER' as const,
          name: partner.companyName,
          serviceType: partner.serviceType,
          location: `${partner.billingCity || ''}, France`,
          rating: 4.5, // Valeur par défaut (pas de rating dans le modèle Partner)
          price: partner.basePrice ?? undefined,
          capacity: partner.maxCapacity ?? undefined,
          description: partner.description ?? undefined,
          features: partner.services || [],
          imageUrl,
          images: partner.images || bestStorefront?.images || [],
          latitude: partner.latitude ?? undefined,
          longitude: partner.longitude ?? undefined,
          interventionRadius: partner.interventionRadius ?? undefined
        }

        // Calculer la distance si les coordonnées sont disponibles
        if (analysis.userCoordinates && partner.latitude && partner.longitude) {
          result.distance = calculateDistance(
            analysis.userCoordinates.lat,
            analysis.userCoordinates.lng,
            partner.latitude,
            partner.longitude
          )
        }

        // Calculer le score de pertinence
        const { score, matchedCriteria } = calculateRelevanceScore(result, analysis)
        result.score = score
        result.matchedCriteria = matchedCriteria

        return result
      })

      results.push(...partnerResults)
    }

    console.log(`📊 Total résultats avant tri: ${results.length}`)

    // 5. Filtrer par distance maximale si spécifiée
    if (analysis.maxDistance && analysis.userCoordinates) {
      const beforeFilter = results.length
      const withCoordinates = results.filter(r => r.distance !== undefined).length
      const withoutCoordinates = results.filter(r => r.distance === undefined).length

      // Séparer les résultats avec et sans coordonnées
      const resultsWithDistance = results.filter(r => r.distance !== undefined && r.distance <= analysis.maxDistance!)
      const resultsWithoutCoords = results.filter(r => r.distance === undefined)

      // Si on a des résultats avec distance, les prioriser
      // Sinon, inclure aussi ceux sans coordonnées (filtrés par ville/région)
      if (resultsWithDistance.length > 0) {
        // On a des résultats avec distance vérifiée, mais on ajoute aussi ceux sans coords de la même région
        results = [...resultsWithDistance, ...resultsWithoutCoords]
      } else {
        // Pas de résultats avec distance, garder ceux sans coordonnées
        results = resultsWithoutCoords
      }

      console.log(`🗺️ Filtre distance appliqué:`)
      console.log(`   Avant: ${beforeFilter} résultats (${withCoordinates} avec coords, ${withoutCoordinates} sans coords)`)
      console.log(`   Après: ${results.length} résultats dans un rayon de ${analysis.maxDistance}km`)
      console.log(`   Exclus: ${beforeFilter - results.length} résultats (trop loin ou sans coordonnées)`)
    }

    // 6. Trier par score de pertinence (du plus élevé au plus bas)
    results.sort((a, b) => {
      const scoreA = a.score || 0
      const scoreB = b.score || 0

      // Si scores égaux, trier par distance (plus proche d'abord)
      if (scoreA === scoreB && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }

      // Sinon trier par score descendant
      return scoreB - scoreA
    })

    console.log(`🎯 Top 5 résultats après tri:`)
    results.slice(0, 5).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} - Score: ${result.score}, Distance: ${result.distance ? result.distance.toFixed(1) + 'km' : 'N/A'}, Critères: ${result.matchedCriteria?.join(', ') || 'aucun'}`)
    })

    // 7. Pagination
    const paginatedResults = results.slice(offset, offset + limit)
    const hasMore = offset + limit < results.length

    console.log(`📄 Pagination: ${paginatedResults.length} résultats (page ${Math.floor(offset / limit) + 1})`)
    console.log(`📄 Has more: ${hasMore}`)

    return NextResponse.json({
      results: paginatedResults,
      criteria: analysis,
      total: results.length,
      hasMore,
      offset,
      limit
    })

  } catch (error) {
    console.error('❌ Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
} 
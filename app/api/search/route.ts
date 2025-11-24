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
1. Identifie le TYPE DE SERVICE principal (un seul, le plus pertinent)
2. Extrait le TYPE DE LIEU spécifique si LIEU demandé (château, domaine, etc.)
3. Détecte la LOCALISATION précise (ville) ou zone géographique
4. Extrait la DISTANCE MAXIMALE si mentionnée (en km)
5. Liste les FEATURES/CARACTÉRISTIQUES demandées (jardin, parking, etc.)
6. Identifie le STYLE si mentionné
7. Extrait la CAPACITÉ avec tolérance si mentionnée
8. Détecte le BUDGET si mentionné

Réponds UNIQUEMENT avec ce JSON (pas de texte avant/après) :
{
  "serviceType": ["LIEU"],
  "location": "paris",
  "venueType": "château",
  "maxDistance": 50,
  "features": ["jardin", "parking"],
  "style": ["champêtre"],
  "capacity": {"min": 90, "max": 120},
  "budget": {"min": 5000, "max": 15000}
}

EXEMPLES :

Requête : "Château avec jardin près de Paris pour 100 personnes"
→ {
  "serviceType": ["LIEU"],
  "location": "paris",
  "venueType": "château",
  "maxDistance": 50,
  "features": ["jardin"],
  "capacity": {"min": 90, "max": 120}
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
  "style": ["reportage"]
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
      userCoordinates,
      maxDistance: parsed.maxDistance || undefined
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
    
    const result: SearchCriteria = {
      serviceType: serviceType.length > 0 ? serviceType : ['LIEU'],
      location,
      features,
      date: '',
      style: []
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

    // 2. Recherche dans les établissements (si LIEU demandé)
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

      // 3. Filtrage par capacité avec tolérance intelligente
      if (analysis.capacity?.min || analysis.capacity?.max) {
        const capacityFilter: any = {}
        if (analysis.capacity.min) {
          capacityFilter.gte = analysis.capacity.min
        }
        if (analysis.capacity.max) {
          capacityFilter.lte = analysis.capacity.max
        }
        andFilters.push({ maxCapacity: capacityFilter })
        console.log(`👥 Filtre capacité: ${analysis.capacity.min || 0}-${analysis.capacity.max || '∞'}`)
      }

      // 4. Filtrage par localisation (ne pas filtrer en DB si on a des coordonnées, on triera après)
      if (analysis.location && !analysis.userCoordinates) {
        // Seulement si on n'a pas de coordonnées pour le tri par distance
        const locationTerms = analysis.location.toLowerCase().split(' ')
        andFilters.push({
          OR: [
            { city: { contains: analysis.location, mode: 'insensitive' as const } },
            { region: { contains: analysis.location, mode: 'insensitive' as const } },
            ...locationTerms.map(term => ({
              OR: [
                { city: { contains: term, mode: 'insensitive' as const } },
                { region: { contains: term, mode: 'insensitive' as const } }
              ]
            }))
          ]
        })
        console.log(`📍 Filtre localisation: ${analysis.location}`)
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
          latitude: establishment.latitude,
          longitude: establishment.longitude
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

    // 3. Recherche dans les partenaires (si autres types demandés)
    const partnerTypes = analysis.serviceType.filter(type => type !== 'LIEU')
    if (partnerTypes.length > 0) {
      console.log('👨‍💼 Recherche partenaires:', partnerTypes)
      
      const partners = await prisma.partner.findMany({
        where: {
          serviceType: { in: partnerTypes },
          // Filtrage par localisation si spécifiée
          ...(analysis.location && {
            OR: [
              { billingCity: { contains: analysis.location, mode: 'insensitive' } },
              { interventionCities: { has: analysis.location } }
            ]
          }),
          // Filtrage par capacité si spécifiée
          ...(analysis.capacity?.min && { maxCapacity: { gte: analysis.capacity.min } }),
          ...(analysis.capacity?.max && { maxCapacity: { lte: analysis.capacity.max } })
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
          rating: true,
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

        const result: SearchResult = {
          id: bestStorefront?.id || partner.id,
          type: 'PARTNER' as const,
          name: partner.companyName,
          serviceType: partner.serviceType,
          location: `${partner.billingCity}, France`,
          rating: partner.rating || 4.5,
          price: partner.basePrice || undefined,
          capacity: partner.maxCapacity,
          description: partner.description,
          features: partner.services || [],
          imageUrl,
          images: bestStorefront?.images || [],
          latitude: partner.latitude,
          longitude: partner.longitude,
          interventionRadius: partner.interventionRadius
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

    // 4. Filtrer par distance maximale si spécifiée
    if (analysis.maxDistance && analysis.userCoordinates) {
      const beforeFilter = results.length
      const withCoordinates = results.filter(r => r.distance !== undefined).length
      const withoutCoordinates = results.filter(r => r.distance === undefined).length

      results = results.filter(result => {
        // Si une distance max est demandée, exclure ceux sans coordonnées
        if (result.distance === undefined) return false
        return result.distance <= analysis.maxDistance!
      })

      console.log(`🗺️ Filtre distance appliqué:`)
      console.log(`   Avant: ${beforeFilter} résultats (${withCoordinates} avec coords, ${withoutCoordinates} sans coords)`)
      console.log(`   Après: ${results.length} résultats dans un rayon de ${analysis.maxDistance}km`)
      console.log(`   Exclus: ${beforeFilter - results.length} résultats (trop loin ou sans coordonnées)`)
    }

    // 5. Trier par score de pertinence (du plus élevé au plus bas)
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

    // 5. Pagination
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
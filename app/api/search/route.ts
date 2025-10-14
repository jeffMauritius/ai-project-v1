import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Types simplifiés
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
}

interface SearchCriteria {
  serviceType: string[]
  location: string
  budget?: { min?: number; max?: number }
  capacity?: { min?: number; max?: number }
  date: string
  features: string[]
  style: string[]
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
  console.log('🤖 Analyse IA pour:', query)
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant spécialisé dans l'analyse de requêtes de mariage. 
            Analyse la requête utilisateur et extrais les informations suivantes :
            
            SERVICE TYPE (un seul) :
            - LIEU : château, chateau, auberge, domaine, hôtel, hotel, restaurant, salle, bateau, plage
            - TRAITEUR : traiteur, cuisine, repas, buffet, cocktail
            - PHOTOGRAPHE : photographe, photo, reportage, shooting
            - VOITURE : voiture, limousine, bus, transport
            - MUSIQUE : musique, dj, orchestre, groupe
            - DECORATION : décoration, déco, décoration florale
            - FLORISTE : fleuriste, fleurs, bouquet, centre de table
            - ANIMATION : animation, magicien, clown, spectacle
            - VIDEO : vidéaste, film, montage
            
            LOCALISATION : région, ville, département mentionnés
            
            CAPACITÉ : nombre d'invités mentionné
            
            STYLE : champêtre, moderne, vintage, bohème, classique, etc.
            
            FEATURES (types de lieux spécifiques) : château, auberge, domaine, hôtel, restaurant, salle, bateau
            
            Réponds UNIQUEMENT avec un JSON valide dans ce format :
            {
              "serviceType": ["LIEU"],
              "location": "sud de la france",
              "budget": {"min": 1000, "max": 5000},
              "capacity": {"min": 80, "max": 100},
              "date": "été 2024",
              "features": ["château", "jardin"],
              "style": ["champêtre"]
            }`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('🤖 Réponse OpenAI brute:', aiResponse)
    
    // Parser la réponse JSON
    const parsed = JSON.parse(aiResponse)
    
    const result: SearchCriteria = {
      serviceType: parsed.serviceType || ['LIEU'],
      location: parsed.location || '',
      budget: parsed.budget || undefined,
      capacity: parsed.capacity || undefined,
      date: parsed.date || '',
      features: parsed.features || [],
      style: parsed.style || []
    }
    
    queryCache.set(cacheKey, result)
    console.log('🤖 Analyse IA:', result)
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
      
      // Requête Prisma intelligente avec critères IA
      let whereClause: any = {}
      
      // Filtrage par type de lieu (features OU style)
      const venueTypes = [...analysis.features, ...analysis.style]
      
      // Mapping des mots-clés vers les types d'établissements
      const venueTypeMapping: Record<string, string> = {
        'château': 'château',
        'chateau': 'château',
        'auberge': 'auberge',
        'domaine': 'domaine',
        'salle': 'salle',
        'restaurant': 'restaurant',
        'hôtel': 'hôtel',
        'hotel': 'hôtel',
        'bateau': 'bateau'
      }
      
      // Chercher le premier type correspondant
      for (const venueType of venueTypes) {
        const mappedType = venueTypeMapping[venueType.toLowerCase()]
        if (mappedType) {
          whereClause.type = { contains: mappedType, mode: 'insensitive' }
          break // Prendre le premier match
        }
      }
      
      // Filtrage par localisation si spécifiée (plus flexible)
      if (analysis.location) {
        const locationTerms = analysis.location.toLowerCase().split(' ')
        whereClause.OR = [
          { city: { contains: analysis.location, mode: 'insensitive' } },
          { region: { contains: analysis.location, mode: 'insensitive' } },
          // Recherche par mots-clés de localisation
          ...locationTerms.map(term => ({
            OR: [
              { city: { contains: term, mode: 'insensitive' } },
              { region: { contains: term, mode: 'insensitive' } }
            ]
          }))
        ]
      }
      
      // Filtrage par capacité si spécifiée (plus flexible)
      if (analysis.capacity?.min) {
        whereClause.maxCapacity = { gte: Math.max(1, analysis.capacity.min - 20) } // Tolérance de 20 personnes
      }
      if (analysis.capacity?.max) {
        whereClause.maxCapacity = { ...whereClause.maxCapacity, lte: analysis.capacity.max + 50 } // Tolérance de 50 personnes
      }
      
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
        take: 2000 // Augmenter pour avoir tous les châteaux
      })
      
      console.log(`🏰 ${establishments.length} établissements trouvés`)

      results.push(...establishments.map(establishment => ({
        id: establishment.storefronts[0]?.id || establishment.id, // Utiliser l'ID du storefront si disponible
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
            establishment.hasTerrace ? 'terrasse' : '',
            establishment.hasKitchen ? 'cuisine' : '',
            establishment.hasAccommodation ? 'hébergement' : ''
          ].filter(Boolean),
        imageUrl: establishment.images?.[0],
          images: establishment.images || [],
        latitude: establishment.latitude,
        longitude: establishment.longitude
      })))
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
      
      console.log(`👨‍💼 ${partners.length} partenaires trouvés`)
      
      results.push(...partners.map(partner => {
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
        
        return {
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
      }))
    }

    console.log(`📊 Total résultats: ${results.length}`)

    // 4. Pagination simple
    const paginatedResults = results.slice(offset, offset + limit)
    const hasMore = offset + limit < results.length

    console.log(`📄 Pagination: ${paginatedResults.length} résultats`)
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
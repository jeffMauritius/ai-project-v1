import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { PrismaClient, ServiceType, StorefrontType } from '@prisma/client'
import { transformImageUrlWithEntity } from '@/lib/image-url-transformer'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface SearchCriteria {
  serviceType?: string[]
  location?: string
  budget?: { min: number; max: number }
  capacity?: { min: number; max: number }
  date?: string
  features?: string[]
  style?: string[]
}

interface SearchResult {
  id: string
  type: 'VENUE' | 'PARTNER'
  name: string
  serviceType?: string
  location: string
  rating: number
  price: number
  capacity?: number
  description: string
  features: string[]
  imageUrl?: string
  // Coordonnées géographiques (pour calcul de distance)
  latitude?: number
  longitude?: number
  // Rayon d'intervention (pour les partenaires)
  interventionRadius?: number
}

// Mapping dynamique des régions vers leurs villes principales
const REGION_CITIES_MAP: Record<string, string[]> = {
  'sud de la France': [
    // Provence-Alpes-Côte d'Azur
    'Marseille', 'Nice', 'Toulon', 'Avignon', 'Aix-en-Provence', 'Cannes', 'Antibes',
    // Occitanie
    'Toulouse', 'Montpellier', 'Perpignan', 'Nîmes', 'Béziers', 'Sète',
    // Corse
    'Ajaccio', 'Bastia', 'Calvi', 'Porto-Vecchio',
    // Nouvelle-Aquitaine (partie sud)
    'Bordeaux', 'Biarritz', 'Bayonne', 'Pau',
    // Auvergne-Rhône-Alpes (partie sud)
    'Lyon', 'Grenoble', 'Valence', 'Avignon'
  ],
  'nord de la France': [
    'Lille', 'Dunkerque', 'Calais', 'Boulogne-sur-Mer', 'Arras', 'Valenciennes'
  ],
  'ouest de la France': [
    'Nantes', 'Rennes', 'Brest', 'Quimper', 'Vannes', 'Saint-Malo', 'Le Mans'
  ],
  'est de la France': [
    'Strasbourg', 'Nancy', 'Metz', 'Mulhouse', 'Colmar', 'Reims', 'Troyes'
  ],
  'centre de la France': [
    'Orléans', 'Tours', 'Bourges', 'Châteauroux', 'Vierzon', 'Blois'
  ]
}

// Coordonnées des villes principales (pour calcul de distance)
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Marseille': { lat: 43.2965, lng: 5.3698 },
  'Nice': { lat: 43.7102, lng: 7.2620 },
  'Toulon': { lat: 43.1242, lng: 5.9280 },
  'Avignon': { lat: 43.9493, lng: 4.8055 },
  'Aix-en-Provence': { lat: 43.5297, lng: 5.4474 },
  'Toulouse': { lat: 43.6047, lng: 1.4442 },
  'Montpellier': { lat: 43.6108, lng: 3.8767 },
  'Lyon': { lat: 45.7578, lng: 4.8320 },
  'Bordeaux': { lat: 44.8378, lng: -0.5792 },
  'Paris': { lat: 48.8566, lng: 2.3522 }
}

// Fonction de calcul de distance entre deux points (formule de Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Fonction pour obtenir les coordonnées d'une ville
function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  // Recherche exacte d'abord
  if (CITY_COORDINATES[cityName]) {
    return CITY_COORDINATES[cityName]
  }
  
  // Recherche partielle (insensible à la casse)
  const normalizedCityName = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    const normalizedCity = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (normalizedCity.includes(normalizedCityName) || normalizedCityName.includes(normalizedCity)) {
      return coords
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    console.log('🔍 Requête reçue:', query)

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // 1. Analyser la requête avec OpenAI
    const analysis = await analyzeQueryWithAI(query)
    console.log('🤖 Analyse OpenAI:', analysis)
    console.log('🔍 Types de service demandés:', analysis.serviceType || [])
    console.log('🔍 Inclut LIEU:', analysis.serviceType?.includes('LIEU') || false)
    console.log('🔍 Inclut d\'autres types:', analysis.serviceType?.some(type => type !== 'LIEU') || false)

    // 2. Construire la requête Prisma
    const prismaQuery = buildPrismaQuery(analysis)
    console.log('📊 Requête Prisma:', JSON.stringify(prismaQuery, null, 2))

    // 3. Exécuter la recherche
    let results: SearchResult[] = []

    if (analysis.serviceType?.includes('LIEU') || !analysis.serviceType) {
      // Rechercher dans les lieux (Establishments) avec leurs PartnerStorefront
      console.log('🏰 Recherche dans les établissements...')
      const establishments = await prisma.establishment.findMany({
        where: Object.keys(prismaQuery.establishment).length > 0 ? prismaQuery.establishment : undefined,
        include: {
          storefronts: {
            include: {
              media: true // Inclure les médias (images/vidéos) des storefronts
            }
          }
        }
      })
      console.log(`🏰 ${establishments.length} établissements trouvés`)

      // Filtrer d'abord les établissements qui ont des PartnerStorefront
      const establishmentsWithStorefronts = establishments.filter(establishment => establishment.storefronts.length > 0)
      console.log(`🏰 ${establishmentsWithStorefronts.length} établissements avec PartnerStorefront trouvés`)

      results.push(...establishmentsWithStorefronts.map(establishment => {
        const storefront = establishment.storefronts[0]
        
        // Récupérer la première image du storefront
        let imageUrl = establishment.imageUrl || undefined
        if (storefront.media && storefront.media.length > 0) {
          const firstImage = storefront.media.find(media => media.type === 'IMAGE')
          if (firstImage) {
            imageUrl = transformImageUrlWithEntity(firstImage.url, establishment.id, 'establishments', 1)
          }
        } else if (establishment.imageUrl) {
          imageUrl = transformImageUrlWithEntity(establishment.imageUrl, establishment.id, 'establishments', 1)
        }
        
        return {
          id: storefront.id, // ID du PartnerStorefront au lieu de l'Establishment
          type: 'VENUE' as const,
          name: establishment.name,
          serviceType: 'LIEU',
          location: `${establishment.city}, ${establishment.region}`,
          rating: establishment.rating,
          price: establishment.startingPrice,
          capacity: establishment.maxCapacity,
          description: establishment.description,
          features: [
            establishment.venueType.toLowerCase(),
            establishment.hasParking ? 'parking' : '',
            establishment.hasTerrace ? 'terrasse' : '',
            establishment.hasKitchen ? 'cuisine' : '',
            establishment.hasAccommodation ? 'hébergement' : ''
          ].filter(Boolean),
          imageUrl: imageUrl, // Vraie image du storefront ou image de l'établissement
          images: establishment.images || [],
          latitude: establishment.latitude || undefined,
          longitude: establishment.longitude || undefined,
          interventionRadius: undefined // Les établissements n'ont pas de rayon d'intervention
        }
      }))
    }

    // Rechercher dans les prestataires (Partners) si demandé
    if (analysis.serviceType && analysis.serviceType.some(type => type !== 'LIEU')) {
      console.log('👨‍💼 Recherche dans les prestataires...')
      
      // Construire la requête pour les partenaires
      const partnerQuery: any = {}
      
      // Filtrer par type de service si spécifié
      const requestedServiceTypes = analysis.serviceType.filter(type => type !== 'LIEU')
      if (requestedServiceTypes.length > 0) {
        partnerQuery.serviceType = { in: requestedServiceTypes }
      }
      
      // Ajouter les autres filtres existants
      if (Object.keys(prismaQuery.partner).length > 0) {
        Object.assign(partnerQuery, prismaQuery.partner)
      }
      
      console.log('🔍 Requête partenaires:', JSON.stringify(partnerQuery, null, 2))
      
      const partners = await prisma.partner.findMany({
        where: partnerQuery,
        include: {
          storefronts: {
            include: {
              media: true // Inclure les médias (images/vidéos) des storefronts
            }
          }
        }
      })
      console.log(`👨‍💼 ${partners.length} prestataires trouvés`)

      // Filtrer d'abord les partenaires qui ont des PartnerStorefront
      const partnersWithStorefronts = partners.filter(partner => partner.storefronts.length > 0)
      console.log(`👨‍💼 ${partnersWithStorefronts.length} partenaires avec PartnerStorefront trouvés`)

      results.push(...partnersWithStorefronts.map(partner => {
        // Choisir le meilleur storefront : actif avec contenu ou le plus récent
        let bestStorefront = partner.storefronts[0]
        
        // Priorité 1: Storefront actif avec contenu
        const activeWithContent = partner.storefronts.find(s => 
          s.isActive && 
          partner.options && 
          typeof partner.options === 'object' &&
          Object.keys(partner.options as Record<string, any>).some(key => {
            const optionValue = (partner.options as Record<string, any>)[key]
            return optionValue && 
              typeof optionValue === 'object' && 
              Object.keys(optionValue).length > 0
          })
        )
        
        if (activeWithContent) {
          bestStorefront = activeWithContent
        } else {
          // Priorité 2: Storefront actif
          const activeStorefront = partner.storefronts.find(s => s.isActive)
          if (activeStorefront) {
            bestStorefront = activeStorefront
          } else {
            // Priorité 3: Storefront le plus récent
            bestStorefront = partner.storefronts.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )[0]
          }
        }
        
        // Récupérer la première image du storefront
        let imageUrl = undefined
        if (bestStorefront.media && bestStorefront.media.length > 0) {
          const firstImage = bestStorefront.media.find(media => media.type === 'IMAGE')
          if (firstImage) {
            imageUrl = transformImageUrlWithEntity(firstImage.url, partner.id, 'partners', 1)
          }
        }
        
        return {
          id: bestStorefront.id, // ID du meilleur PartnerStorefront
          type: 'PARTNER' as const,
          name: partner.companyName,
          serviceType: partner.serviceType,
          location: `${partner.billingCity}, France`,
          rating: 4.5, // Note par défaut
          price: partner.basePrice || 0,
          capacity: partner.maxCapacity || undefined,
          description: partner.description,
          features: partner.services || [],
          imageUrl: imageUrl, // Vraie image du storefront ou undefined
          latitude: partner.latitude || undefined,
          longitude: partner.longitude || undefined,
          interventionRadius: partner.interventionRadius || undefined
        }
      }))
      
      // Debug: vérifier les résultats des partenaires
      console.log('🔍 Debug partenaires - Premier résultat:', results[results.length - 1])
      console.log('🔍 Debug partenaires - imageUrl:', results[results.length - 1]?.imageUrl)
    } else {
      console.log('❌ Condition non remplie pour la recherche de partenaires')
      console.log('❌ analysis.serviceType:', analysis.serviceType)
      console.log('❌ Inclut LIEU:', analysis.serviceType?.includes('LIEU'))
      console.log('❌ Inclut d\'autres types:', analysis.serviceType?.some(type => type !== 'LIEU'))
    }

    console.log(`📊 Total des résultats: ${results.length}`)

    // 4. Filtrer les résultats selon les critères
    const filteredResults = filterResultsByCriteria(results, analysis)
    console.log(`✅ Résultats filtrés: ${filteredResults.length}`)

    return NextResponse.json({
      results: filteredResults,
      criteria: analysis,
      total: filteredResults.length
    })

  } catch (error) {
    console.error('❌ Erreur API de recherche:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace')
    return NextResponse.json(
      { error: 'Erreur lors de la recherche', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

async function analyzeQueryWithAI(query: string): Promise<SearchCriteria> {
  const prompt = `
Analyse cette requête de recherche de mariage et extrait les critères suivants au format JSON :

Critères à extraire :
- serviceType: tableau des types de service (LIEU, TRAITEUR, PHOTOGRAPHE, MUSIQUE, FLORISTE, DECORATION, VOITURE, VIDEO, WEDDING_CAKE, OFFICIANT, FOOD_TRUCK, VIN, etc.)
- location: ville ou région (vide si non spécifié)
- budget: objet avec min et max en euros (vide si non spécifié)
- capacity: objet avec min et max de personnes (vide si non spécifié)
- date: date au format YYYY-MM-DD (vide si non spécifié)
- features: tableau des caractéristiques recherchées (château, jardin, terrasse, etc.)
- style: tableau des styles (moderne, classique, romantique, etc.)

Exemples de mapping :
- "restaurant" → serviceType: ["LIEU"], features: ["restaurant"]
- "château" → serviceType: ["LIEU"], features: ["chateau"]
- "domaine" → serviceType: ["LIEU"], features: ["domaine"]
- "traiteur" → serviceType: ["TRAITEUR"]
- "photographe" → serviceType: ["PHOTOGRAPHE"]
- "sud de la France" → location: "sud de la France"
- "pour 100 personnes" → capacity: {min: 80, max: 120}
- "budget 2000€" → budget: {min: 1500, max: 2500}
- "avec jardin" → features: ["jardin"]
- "style moderne" → style: ["moderne"]

Requête: "${query}"

Réponds uniquement avec le JSON, sans texte supplémentaire.
`

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  })

  const response = completion.choices[0]?.message?.content
  console.log('🤖 Réponse OpenAI brute:', response)

  try {
    const criteria = JSON.parse(response || '{}')
    return {
      serviceType: criteria.serviceType || [],
      location: criteria.location || '',
      budget: criteria.budget || undefined,
      capacity: criteria.capacity || undefined,
      date: criteria.date || '',
      features: criteria.features || [],
      style: criteria.style || []
    }
  } catch (error) {
    console.error('❌ Erreur parsing OpenAI:', error)
    return {
      serviceType: [],
      location: '',
      budget: undefined,
      capacity: undefined,
      date: '',
      features: [],
      style: []
    }
  }
}

function buildPrismaQuery(criteria: SearchCriteria) {
  const query = {
    establishment: {} as any,
    partner: {} as any
  }

  // Filtres pour les établissements (lieux)
  if (criteria.location) {
    if (REGION_CITIES_MAP[criteria.location]) {
      // Utiliser le mapping dynamique
      const cities = REGION_CITIES_MAP[criteria.location]
      query.establishment.OR = cities.map(city => ({
        city: { contains: city, mode: 'insensitive' }
      }))
      // Ajouter aussi la recherche par région
      query.establishment.OR.push(
        { region: { contains: criteria.location, mode: 'insensitive' } }
      )
    } else {
      // Recherche directe par ville/région
      query.establishment.OR = [
        { city: { contains: criteria.location, mode: 'insensitive' } },
        { region: { contains: criteria.location, mode: 'insensitive' } }
      ]
    }
  }

  if (criteria.capacity) {
    query.establishment.maxCapacity = {
      gte: criteria.capacity.min,
      lte: criteria.capacity.max
    }
  }

  if (criteria.budget) {
    query.establishment.startingPrice = {
      gte: criteria.budget.min,
      lte: criteria.budget.max
    }
  }

  // Filtres pour les partenaires
  if (criteria.serviceType && criteria.serviceType.length > 0 && !criteria.serviceType.includes('LIEU')) {
    query.partner.serviceType = {
      in: criteria.serviceType as ServiceType[]
    }
  }

  // Pour les partenaires, on ne filtre plus par ville ici
  // On filtrera par distance après avoir récupéré les résultats
  // Cela permet d'utiliser le rayon d'intervention de chaque partenaire

  if (criteria.capacity) {
    query.partner.maxCapacity = {
      gte: criteria.capacity.min,
      lte: criteria.capacity.max
    }
  }

  if (criteria.budget) {
    query.partner.basePrice = {
      gte: criteria.budget.min,
      lte: criteria.budget.max
    }
  }

  return query
}

function filterResultsByCriteria(results: SearchResult[], criteria: SearchCriteria): SearchResult[] {
  return results.filter(result => {
    // Filtre par capacité
    if (criteria.capacity && result.capacity) {
      if (result.capacity < criteria.capacity.min || result.capacity > criteria.capacity.max) {
        return false
      }
    }

    // Filtre par budget
    if (criteria.budget && result.price) {
      if (result.price < criteria.budget.min || result.price > criteria.budget.max) {
        return false
      }
    }

    // Filtre par caractéristiques UNIQUEMENT pour les lieux (VENUE)
    // Ne pas filtrer les partenaires par features car ils n'ont pas de caractéristiques architecturales
    if (criteria.features && criteria.features.length > 0 && result.type === 'VENUE') {
      const hasFeature = criteria.features.some(feature => 
        result.features.some(f => {
          const normalizedFeature = feature.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const normalizedF = f.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          return normalizedF.includes(normalizedFeature)
        })
      )
      if (!hasFeature) {
        return false
      }
    }

    // Filtre par style UNIQUEMENT pour les lieux (VENUE)
    // Ne pas filtrer les partenaires par style
    if (criteria.style && criteria.style.length > 0 && result.type === 'VENUE') {
      const hasStyle = criteria.style.some(style => 
        result.features.some(f => {
          const normalizedStyle = style.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const normalizedF = f.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          return normalizedF.includes(normalizedStyle)
        })
      )
      if (!hasStyle) {
        return false
      }
    }

    // Filtre par localisation géographique pour les partenaires
    if (criteria.location && result.type === 'PARTNER') {
      // Obtenir les coordonnées de la ville demandée
      const targetCoords = getCityCoordinates(criteria.location)
      if (targetCoords) {
        // Vérifier si le partenaire a des coordonnées
        if (result.latitude && result.longitude) {
          const distance = calculateDistance(
            targetCoords.lat, 
            targetCoords.lng, 
            result.latitude, 
            result.longitude
          )
          
          // Vérifier le rayon d'intervention du partenaire
          if (result.interventionRadius && distance > result.interventionRadius) {
            return false // Trop loin du rayon d'intervention
          }
        }
      }
    }

    return true
  })
} 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configuration
const DELAY_MS = 1100 // Délai entre les requêtes (1 req/sec pour Nominatim)
const BATCH_SIZE = 100 // Taille des lots
const BATCH_PAUSE_MS = 5000 // Pause entre les lots (5 secondes)

// Cache des coordonnées par ville pour éviter les requêtes répétées
const cityCache: Map<string, { lat: number; lng: number } | null> = new Map()

interface GeocodingResult {
  lat: string
  lon: string
  display_name: string
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

// Fonction pour géocoder une adresse avec Nominatim (OpenStreetMap)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Vérifier le cache d'abord
    const cacheKey = address.toLowerCase().trim()
    if (cityCache.has(cacheKey)) {
      return cityCache.get(cacheKey) || null
    }

    const encodedAddress = encodeURIComponent(address + ', France')
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MonMariage-GPS-Completion/1.0 (contact@monmariage.ai)'
      }
    })

    if (!response.ok) {
      console.error(`   ❌ Erreur HTTP: ${response.status}`)
      cityCache.set(cacheKey, null)
      return null
    }

    const data: GeocodingResult[] = await response.json()

    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
      cityCache.set(cacheKey, result)
      return result
    }

    cityCache.set(cacheKey, null)
    return null
  } catch (error) {
    console.error(`   ❌ Erreur géocodage:`, error)
    return null
  }
}

async function completeAllEstablishmentCoordinates() {
  console.log('\n🏰 COMPLÉTION AUTOMATIQUE GPS - ÉTABLISSEMENTS')
  console.log('='.repeat(60))

  const startTime = Date.now()
  let totalUpdated = 0
  let totalFailed = 0
  let batchNumber = 0

  while (true) {
    batchNumber++

    // Récupérer les établissements sans coordonnées
    const allEstablishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        region: true,
        address: true,
        postalCode: true,
        latitude: true,
        longitude: true
      }
    })

    const establishments = allEstablishments
      .filter(e => e.latitude === null || e.longitude === null || e.latitude === undefined || e.longitude === undefined)
      .slice(0, BATCH_SIZE)

    if (establishments.length === 0) {
      console.log('\n✅ Tous les établissements ont été traités!')
      break
    }

    const remaining = allEstablishments.filter(e => e.latitude === null || e.longitude === null).length
    console.log(`\n📦 LOT ${batchNumber} - ${establishments.length} établissements (${remaining} restants)`)
    console.log('-'.repeat(40))

    let updated = 0
    let failed = 0

    for (let i = 0; i < establishments.length; i++) {
      const est = establishments[i]
      const globalIndex = (batchNumber - 1) * BATCH_SIZE + i + 1
      process.stdout.write(`\r[${globalIndex}] ${est.name.substring(0, 40).padEnd(40)}`)

      const postalCode = est.postalCode && est.postalCode !== '00000' ? est.postalCode : ''

      let searchAddress = ''
      if (est.address && est.address.length > 5) {
        searchAddress = `${est.address}, ${postalCode} ${est.city}`.trim()
      } else if (est.city && est.city.length > 2 && !est.city.includes('Région')) {
        searchAddress = `${postalCode} ${est.city}`.trim()
      } else if (est.region && est.region !== 'Région non spécifiée') {
        searchAddress = est.region
      } else {
        failed++
        totalFailed++
        continue
      }

      searchAddress = searchAddress.replace(/\s+/g, ' ').trim()
      const coords = await geocodeAddress(searchAddress)

      if (coords) {
        await prisma.establishment.update({
          where: { id: est.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng
          }
        })
        updated++
        totalUpdated++
      } else {
        failed++
        totalFailed++
      }

      await sleep(DELAY_MS)
    }

    const elapsed = Date.now() - startTime
    console.log(`\n   ✅ Lot ${batchNumber}: ${updated} mis à jour, ${failed} échoués`)
    console.log(`   ⏱️  Temps écoulé: ${formatDuration(elapsed)}`)
    console.log(`   📊 Total: ${totalUpdated} mis à jour, ${totalFailed} échoués`)

    // Pause entre les lots
    if (establishments.length === BATCH_SIZE) {
      console.log(`   ⏸️  Pause de ${BATCH_PAUSE_MS / 1000}s avant le prochain lot...`)
      await sleep(BATCH_PAUSE_MS)
    }
  }

  const totalTime = Date.now() - startTime
  console.log(`\n🎉 TERMINÉ - Établissements`)
  console.log(`   ✅ Total mis à jour: ${totalUpdated}`)
  console.log(`   ❌ Total échoués: ${totalFailed}`)
  console.log(`   ⏱️  Temps total: ${formatDuration(totalTime)}`)

  return { updated: totalUpdated, failed: totalFailed }
}

async function completeAllPartnerCoordinates() {
  console.log('\n👨‍💼 COMPLÉTION AUTOMATIQUE GPS - PARTENAIRES')
  console.log('='.repeat(60))

  const startTime = Date.now()
  let totalUpdated = 0
  let totalFailed = 0
  let batchNumber = 0

  while (true) {
    batchNumber++

    // Récupérer les partenaires sans coordonnées
    const allPartners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        billingCity: true,
        billingPostalCode: true,
        billingStreet: true,
        serviceType: true,
        latitude: true,
        longitude: true
      }
    })

    const partners = allPartners
      .filter(p => p.latitude === null || p.longitude === null || p.latitude === undefined || p.longitude === undefined)
      .slice(0, BATCH_SIZE)

    if (partners.length === 0) {
      console.log('\n✅ Tous les partenaires ont été traités!')
      break
    }

    const remaining = allPartners.filter(p => p.latitude === null || p.longitude === null).length
    console.log(`\n📦 LOT ${batchNumber} - ${partners.length} partenaires (${remaining} restants)`)
    console.log('-'.repeat(40))

    let updated = 0
    let failed = 0

    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i]
      const globalIndex = (batchNumber - 1) * BATCH_SIZE + i + 1
      process.stdout.write(`\r[${globalIndex}] ${partner.companyName.substring(0, 35).padEnd(35)} (${partner.serviceType})`)

      const postalCode = partner.billingPostalCode && partner.billingPostalCode !== '00000' ? partner.billingPostalCode : ''

      let searchAddress = ''
      if (partner.billingStreet && partner.billingStreet.length > 5) {
        searchAddress = `${partner.billingStreet}, ${postalCode} ${partner.billingCity}`.trim()
      } else if (partner.billingCity && partner.billingCity.length > 2) {
        searchAddress = `${postalCode} ${partner.billingCity}`.trim()
      } else {
        failed++
        totalFailed++
        continue
      }

      searchAddress = searchAddress.replace(/\s+/g, ' ').trim()
      const coords = await geocodeAddress(searchAddress)

      if (coords) {
        await prisma.partner.update({
          where: { id: partner.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng
          }
        })
        updated++
        totalUpdated++
      } else {
        failed++
        totalFailed++
      }

      await sleep(DELAY_MS)
    }

    const elapsed = Date.now() - startTime
    console.log(`\n   ✅ Lot ${batchNumber}: ${updated} mis à jour, ${failed} échoués`)
    console.log(`   ⏱️  Temps écoulé: ${formatDuration(elapsed)}`)
    console.log(`   📊 Total: ${totalUpdated} mis à jour, ${totalFailed} échoués`)

    // Pause entre les lots
    if (partners.length === BATCH_SIZE) {
      console.log(`   ⏸️  Pause de ${BATCH_PAUSE_MS / 1000}s avant le prochain lot...`)
      await sleep(BATCH_PAUSE_MS)
    }
  }

  const totalTime = Date.now() - startTime
  console.log(`\n🎉 TERMINÉ - Partenaires`)
  console.log(`   ✅ Total mis à jour: ${totalUpdated}`)
  console.log(`   ❌ Total échoués: ${totalFailed}`)
  console.log(`   ⏱️  Temps total: ${formatDuration(totalTime)}`)

  return { updated: totalUpdated, failed: totalFailed }
}

async function showStats() {
  console.log('\n📊 STATISTIQUES ACTUELLES')
  console.log('='.repeat(60))

  // Récupérer tous les établissements pour compter manuellement
  const allEstablishments = await prisma.establishment.findMany({
    select: { latitude: true, longitude: true, name: true, city: true, region: true }
  })
  const totalEstablishments = allEstablishments.length
  const estWithCoords = allEstablishments.filter(e => e.latitude !== null && e.longitude !== null).length
  const estWithoutCoords = totalEstablishments - estWithCoords

  console.log(`\n🏰 Établissements:`)
  console.log(`   Total: ${totalEstablishments}`)
  console.log(`   Avec GPS: ${estWithCoords} (${((estWithCoords / totalEstablishments) * 100).toFixed(1)}%)`)
  console.log(`   Sans GPS: ${estWithoutCoords} (${((estWithoutCoords / totalEstablishments) * 100).toFixed(1)}%)`)

  // Estimation du temps
  const estTimeMs = estWithoutCoords * DELAY_MS + Math.ceil(estWithoutCoords / BATCH_SIZE) * BATCH_PAUSE_MS
  console.log(`   ⏱️  Temps estimé: ${formatDuration(estTimeMs)}`)

  // Récupérer tous les partenaires pour compter manuellement
  const allPartners = await prisma.partner.findMany({
    select: { latitude: true, longitude: true, companyName: true, billingCity: true, serviceType: true }
  })
  const totalPartners = allPartners.length
  const partnersWithCoords = allPartners.filter(p => p.latitude !== null && p.longitude !== null).length
  const partnersWithoutCoords = totalPartners - partnersWithCoords

  console.log(`\n👨‍💼 Partenaires:`)
  console.log(`   Total: ${totalPartners}`)
  console.log(`   Avec GPS: ${partnersWithCoords} (${((partnersWithCoords / totalPartners) * 100).toFixed(1)}%)`)
  console.log(`   Sans GPS: ${partnersWithoutCoords} (${((partnersWithoutCoords / totalPartners) * 100).toFixed(1)}%)`)

  // Estimation du temps
  const partnerTimeMs = partnersWithoutCoords * DELAY_MS + Math.ceil(partnersWithoutCoords / BATCH_SIZE) * BATCH_PAUSE_MS
  console.log(`   ⏱️  Temps estimé: ${formatDuration(partnerTimeMs)}`)

  // Échantillon d'établissements sans GPS
  console.log(`\n📍 Échantillon établissements sans GPS:`)
  const sampleEst = allEstablishments
    .filter(e => e.latitude === null || e.longitude === null)
    .slice(0, 5)
  if (sampleEst.length > 0) {
    sampleEst.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name} - ${e.city}, ${e.region}`)
    })
  } else {
    console.log(`   (aucun)`)
  }

  // Échantillon de partenaires sans GPS
  console.log(`\n📍 Échantillon partenaires sans GPS:`)
  const samplePartners = allPartners
    .filter(p => p.latitude === null || p.longitude === null)
    .slice(0, 5)
  if (samplePartners.length > 0) {
    samplePartners.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.companyName} (${p.serviceType}) - ${p.billingCity}`)
    })
  } else {
    console.log(`   (aucun)`)
  }

  return { estWithoutCoords, partnersWithoutCoords }
}

async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'stats'

  console.log('🌍 SCRIPT DE COMPLÉTION DES COORDONNÉES GPS')
  console.log('='.repeat(60))
  console.log(`Mode: ${mode}`)
  console.log(`Taille des lots: ${BATCH_SIZE}`)
  console.log(`Délai entre requêtes: ${DELAY_MS}ms`)
  console.log(`Pause entre lots: ${BATCH_PAUSE_MS}ms`)

  try {
    if (mode === 'stats') {
      await showStats()
    } else if (mode === 'establishments' || mode === 'est') {
      await showStats()
      await completeAllEstablishmentCoordinates()
      await showStats()
    } else if (mode === 'partners' || mode === 'part') {
      await showStats()
      await completeAllPartnerCoordinates()
      await showStats()
    } else if (mode === 'all') {
      await showStats()
      console.log('\n🚀 Lancement du géocodage complet...')
      await completeAllEstablishmentCoordinates()
      await completeAllPartnerCoordinates()
      await showStats()
    } else {
      console.log(`
Usage: npx tsx scripts/complete-gps-coordinates.ts [mode]

Modes:
  stats         - Afficher les statistiques (défaut)
  establishments - Compléter TOUS les établissements (par lots de ${BATCH_SIZE})
  est           - Alias pour establishments
  partners      - Compléter TOUS les partenaires (par lots de ${BATCH_SIZE})
  part          - Alias pour partners
  all           - Compléter TOUT (établissements + partenaires)

Exemples:
  npx tsx scripts/complete-gps-coordinates.ts stats
  npx tsx scripts/complete-gps-coordinates.ts est
  npx tsx scripts/complete-gps-coordinates.ts partners
  npx tsx scripts/complete-gps-coordinates.ts all

Note: Le script traite automatiquement par lots de ${BATCH_SIZE} avec une pause
de ${BATCH_PAUSE_MS / 1000}s entre chaque lot pour respecter les limites de l'API.
      `)
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)

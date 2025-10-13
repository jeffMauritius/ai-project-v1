import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping des segments d'URL vers les ServiceType
const URL_TO_SERVICE_TYPE: Record<string, string> = {
  'photo-mariage': 'PHOTOGRAPHE',
  'photographe-mariage': 'PHOTOGRAPHE',
  'photographe': 'PHOTOGRAPHE',
  'video-mariage': 'VIDEO',
  'videaste-mariage': 'VIDEO',
  'videaste': 'VIDEO',
  'traiteur-mariage': 'TRAITEUR',
  'traiteur': 'TRAITEUR',
  'catering': 'TRAITEUR',
  'cuisine': 'TRAITEUR',
  'musique-mariage': 'MUSIQUE',
  'dj-mariage': 'MUSIQUE',
  'orchestre-mariage': 'MUSIQUE',
  'musique': 'MUSIQUE',
  'fleuriste-mariage': 'FLORISTE',
  'fleuriste': 'FLORISTE',
  'fleurs': 'FLORISTE',
  'decoration-mariage': 'DECORATION',
  'decorateur-mariage': 'DECORATION',
  'decoration': 'DECORATION',
  'transport-mariage': 'VOITURE',
  'voiture-mariage': 'VOITURE',
  'limousine-mariage': 'VOITURE',
  'transport': 'VOITURE',
  'voiture': 'VOITURE',
  'gateau-mariage': 'WEDDING_CAKE',
  'wedding-cake': 'WEDDING_CAKE',
  'gateau': 'WEDDING_CAKE',
  'invitation-mariage': 'FAIRE_PART',
  'faire-part': 'FAIRE_PART',
  'invitation': 'FAIRE_PART',
  'organisation-mariage': 'ORGANISATION',
  'wedding-planner': 'ORGANISATION',
  'organisation': 'ORGANISATION',
  'animation-mariage': 'ANIMATION',
  'animation': 'ANIMATION',
  'entertainment': 'ANIMATION',
  'officiant-mariage': 'OFFICIANT',
  'officiant': 'OFFICIANT',
  'cadeaux-invites': 'CADEAUX_INVITES',
  'cadeaux': 'CADEAUX_INVITES',
  'gifts': 'CADEAUX_INVITES',
  'honeymoon': 'LUNE_DE_MIEL',
  'voyage-de-noces': 'LUNE_DE_MIEL',
  'lune-de-miel': 'LUNE_DE_MIEL',
  'beauty-mariage': 'DECORATION', // Maquillage/beauté → DECORATION
  'beauty': 'DECORATION',
  'maquillage': 'DECORATION',
  'robe-mariage': 'DECORATION', // Robes → DECORATION
  'robe': 'DECORATION',
  'dress': 'DECORATION',
  'costume-mariage': 'DECORATION', // Costumes → DECORATION
  'costume': 'DECORATION',
  'suit': 'DECORATION',
  'bijoux-mariage': 'DECORATION', // Bijoux → DECORATION
  'bijoux': 'DECORATION',
  'jewelry': 'DECORATION',
  'vin-mariage': 'VIN',
  'vin': 'VIN',
  'wine': 'VIN',
  'spirits': 'VIN'
}

function extractServiceTypeFromUrl(url: string): string | null {
  if (!url) return null
  
  try {
    const urlObj = new URL(url)
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0)
    
    // Chercher le segment qui correspond à un type de service
    for (const segment of pathSegments) {
      if (URL_TO_SERVICE_TYPE[segment]) {
        return URL_TO_SERVICE_TYPE[segment]
      }
    }
    
    return null
  } catch (error) {
    console.warn(`URL invalide: ${url}`)
    return null
  }
}

async function correctServiceTypesFromUrls() {
  console.log('🔧 CORRECTION DES SERVICETYPE BASÉE SUR LES URLs\n')

  try {
    // Récupérer tous les partenaires
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        serviceType: true
      }
    })

    console.log(`📊 ${partners.length} partenaires à analyser`)

    // Pour chaque partenaire, on va chercher son URL dans les fichiers JSON
    const fs = require('fs')
    const path = require('path')
    
    const dataDir = path.join(__dirname, '..', 'data')
    const jsonFiles = [
      'photographers.json', 'caterers.json', 'decorators.json', 
      'videographers.json', 'music-vendors.json', 'transport.json',
      'florists.json', 'entertainment.json', 'wedding-cakes.json',
      'invitations.json', 'organization.json', 'gifts.json',
      'officiants.json', 'honeymoon.json', 'beauty.json',
      'dresses.json', 'suits.json', 'jewelry.json', 'wine-spirits.json'
    ]

    // Charger tous les fichiers JSON
    const allJsonData: any[] = []
    for (const file of jsonFiles) {
      const filePath = path.join(dataDir, file)
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const vendors = data.vendors || data || []
        allJsonData.push(...vendors)
      }
    }

    console.log(`📄 ${allJsonData.length} entrées JSON chargées`)

    let correctedCount = 0
    let notFoundCount = 0
    let noUrlCount = 0

    for (const partner of partners) {
      // Chercher le partenaire dans les données JSON par nom
      const jsonEntry = allJsonData.find(entry => 
        entry.name && partner.companyName &&
        entry.name.toLowerCase().trim() === partner.companyName.toLowerCase().trim()
      )

      if (!jsonEntry) {
        notFoundCount++
        continue
      }

      if (!jsonEntry.url) {
        noUrlCount++
        continue
      }

      // Extraire le vrai serviceType de l'URL
      const realServiceType = extractServiceTypeFromUrl(jsonEntry.url)
      
      if (!realServiceType) {
        console.log(`⚠️ Impossible de déterminer le type pour: ${partner.companyName} (${jsonEntry.url})`)
        continue
      }

      // Vérifier si une correction est nécessaire
      if (partner.serviceType !== realServiceType) {
        console.log(`🔄 ${partner.companyName}:`)
        console.log(`   Ancien: ${partner.serviceType}`)
        console.log(`   Nouveau: ${realServiceType}`)
        console.log(`   URL: ${jsonEntry.url}`)

        // Effectuer la correction
        await prisma.partner.update({
          where: { id: partner.id },
          data: { serviceType: realServiceType as any }
        })

        correctedCount++
      }
    }

    console.log('\n📊 RÉSULTATS:')
    console.log(`✅ ${correctedCount} partenaires corrigés`)
    console.log(`❌ ${notFoundCount} partenaires non trouvés dans les JSON`)
    console.log(`⚠️ ${noUrlCount} partenaires sans URL`)

    // Vérification finale
    console.log('\n🔍 VÉRIFICATION FINALE:')
    const finalCounts = await prisma.partner.groupBy({
      by: ['serviceType'],
      _count: { serviceType: true },
      orderBy: { _count: { serviceType: 'desc' } }
    })

    console.log('📊 Nouveaux comptages par serviceType:')
    finalCounts.forEach(group => {
      console.log(`  ${group.serviceType}: ${group._count.serviceType}`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  } finally {
    await prisma.$disconnect()
  }
}

correctServiceTypesFromUrls()

const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Fichier de progression
const PROGRESS_FILE = path.join(__dirname, 'import-progress.json')

// Fonctions de gestion de la progression
function saveProgress(step, imported, total) {
  const progress = {
    step,
    imported,
    total,
    timestamp: new Date().toISOString()
  }
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
  console.log(`💾 Progression sauvegardée: ${imported}/${total}`)
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
    console.log(`📂 Progression trouvée: ${progress.imported}/${progress.total} (${progress.step})`)
    return progress
  }
  return null
}

function clearProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE)
    console.log('🗑️ Fichier de progression supprimé')
  }
}

// Types de prestataires
const vendorTypes = {
  'beauty': 'DECORATION',
  'caterers': 'TRAITEUR', 
  'decorators': 'DECORATION',
  'dresses': 'DECORATION',
  'entertainment': 'ANIMATION',
  'florist-decoration': 'FLORISTE',
  'florists': 'FLORISTE',
  'gifts': 'CADEAUX_INVITES',
  'honeymoon': 'LUNE_DE_MIEL',
  'invitations': 'FAIRE_PART',
  'jewelry': 'DECORATION',
  'music-vendors': 'MUSIQUE',
  'officiants': 'OFFICIANT',
  'organization': 'ORGANISATION',
  'photographers': 'PHOTOGRAPHE',
  'suits': 'DECORATION',
  'transport': 'VOITURE',
  'videographers': 'VIDEO',
  'wedding-cakes': 'WEDDING_CAKE',
  'wine-spirits': 'VIN'
}

async function importVenues() {
  console.log('🏰 Importation des lieux de mariage...')
  
  const venuesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/venues.json'), 'utf8'))
  
  // Charger la progression existante
  const progress = loadProgress()
  let startIndex = 0
  let imported = 0
  
  if (progress && progress.step === 'venues') {
    startIndex = progress.imported
    imported = progress.imported
    console.log(`🔄 Reprise de l'importation des établissements à partir de l'index ${startIndex}`)
  }
  
  for (let i = startIndex; i < venuesData.venues.length; i++) {
    const venue = venuesData.venues[i]
    
    try {
      const images = venue.images || []
      
      // Créer l'établissement
      const establishment = await prisma.establishment.create({
        data: {
          name: venue.name,
          description: venue.description || 'Description non disponible',
          type: venue.type || 'Domaine mariage',
          address: venue.address || 'Adresse non spécifiée',
          city: venue.city || 'Ville non spécifiée',
          region: venue.region || 'Région non spécifiée',
          country: 'France',
          postalCode: venue.postalCode || '00000',
          maxCapacity: venue.maxCapacity || 100,
          minCapacity: venue.minCapacity || 10,
          startingPrice: venue.startingPrice || 25,
          currency: 'EUR',
          rating: parseFloat(venue.rating) || 0,
          reviewCount: venue.reviewCount || 0,
          imageUrl: images[0] || null,
          images: images,
          venueType: 'DOMAINE',
          hasParking: false,
          hasGarden: false,
          hasTerrace: false,
          hasKitchen: false,
          hasAccommodation: false
        }
      })
      
      // Créer l'utilisateur
      const email = `${establishment.id}@monmariage.ai`
      const hashedPassword = await argon2.hash('Test123456!')
      const user = await prisma.user.create({
        data: {
          email,
          name: venue.name,
          image: null,
          password: hashedPassword,
          role: 'PARTNER'
        }
      })
      
      // Créer le storefront
      await prisma.partnerStorefront.create({
        data: {
          type: 'VENUE',
          isActive: true,
          logo: images[0] || null,
          images: images,
          establishmentId: establishment.id
        }
      })
      
      imported++
      
      // Sauvegarder la progression tous les 10 établissements
      if (imported % 10 === 0) {
        saveProgress('venues', imported, venuesData.venues.length)
        console.log(`📊 ${imported}/${venuesData.venues.length} lieux importés`)
      }
    } catch (error) {
      console.error(`Erreur pour ${venue.name}:`, error.message)
      // Sauvegarder même en cas d'erreur
      saveProgress('venues', imported, venuesData.venues.length)
    }
  }
  
  // Nettoyer le fichier de progression à la fin
  clearProgress()
  console.log(`✅ ${imported} lieux de mariage importés`)
}

async function importVendors() {
  console.log('🎨 Importation des prestataires...')
  
  let totalImported = 0
  
  for (const [filename, type] of Object.entries(vendorTypes)) {
    try {
      console.log(`📁 Traitement de ${filename}.json...`)
      const vendorData = JSON.parse(fs.readFileSync(path.join(__dirname, `../data/${filename}.json`), 'utf8'))
      
      let imported = 0
      const maxItems = 20
      
      for (let i = 0; i < Math.min(maxItems, vendorData.vendors.length); i++) {
        const vendor = vendorData.vendors[i]
        
        try {
          const images = vendor.images || []
          
          // Créer le partenaire
          const partner = await prisma.partner.create({
            data: {
              companyName: vendor.name,
              description: vendor.description || 'Description non disponible',
              type: type,
              city: vendor.city || 'Ville non spécifiée',
              region: vendor.region || 'Région non spécifiée',
              country: 'France',
              phone: vendor.phone || null,
              email: 'temp@monmariage.ai',
              website: vendor.website || null,
              rating: parseFloat(vendor.rating) || 0,
              reviewCount: vendor.reviewCount || 0,
              logo: images[0] || null,
              images: images,
              userId: 'temp'
            }
          })
          
          // Créer l'utilisateur
          const email = `${partner.id}@monmariage.ai`
          const hashedPassword = await argon2.hash('Test123456!')
          const user = await prisma.user.create({
            data: {
              email,
              name: vendor.name,
              image: null,
              password: hashedPassword,
              role: 'PARTNER'
            }
          })
          
          // Mettre à jour le partenaire
          await prisma.partner.update({
            where: { id: partner.id },
            data: { 
              userId: user.id,
              email: user.email
            }
          })
          
          // Créer le storefront
          await prisma.partnerStorefront.create({
            data: {
              type: 'PARTNER',
              isActive: true,
              logo: images[0] || null,
              images: images,
              partnerId: partner.id
            }
          })
          
          imported++
        } catch (error) {
          console.error(`Erreur pour ${vendor.name}:`, error.message)
        }
      }
      
      console.log(`✅ ${imported} prestataires ${type} importés`)
      totalImported += imported
    } catch (error) {
      console.error(`Erreur lors de l'importation de ${filename}:`, error.message)
    }
  }
  
  console.log(`✅ ${totalImported} prestataires importés au total`)
}

async function main() {
  try {
    console.log('🚀 Début de l\'importation...')
    
    // Vérifier s'il y a une progression existante
    const progress = loadProgress()
    if (progress) {
      console.log(`🔄 Reprise de l'importation depuis: ${progress.step}`)
    }
    
    await importVenues()
    await importVendors()
    
    console.log('🎉 Importation terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur:', error)
    console.log('💡 Pour reprendre l\'importation, relancez simplement le script')
  } finally {
    await prisma.$disconnect()
  }
}

main()




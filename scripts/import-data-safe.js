const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Types de prestataires
const vendorTypes = {
  'beauty': 'BEAUTY',
  'caterers': 'CATERER', 
  'decorators': 'DECORATION',
  'dresses': 'WEDDING_DRESS',
  'entertainment': 'ENTERTAINMENT',
  'florist-decoration': 'FLORIST',
  'florists': 'FLORIST',
  'gifts': 'GIFTS',
  'honeymoon': 'HONEYMOON',
  'invitations': 'INVITATION',
  'jewelry': 'JEWELRY',
  'music-vendors': 'MUSIC',
  'officiants': 'OFFICIANT',
  'organization': 'WEDDING_PLANNER',
  'photographers': 'PHOTOGRAPHER',
  'suits': 'GROOM_SUIT',
  'transport': 'TRANSPORT',
  'videographers': 'VIDEOGRAPHER',
  'wedding-cakes': 'WEDDING_CAKE',
  'wine-spirits': 'WINE'
}

async function createTestUser() {
  // Créer un utilisateur de test pour les établissements
  const hashedPassword = await argon2.hash('Test123456!')
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@monmariage.ai' },
    update: {},
    create: {
      email: 'test@monmariage.ai',
      name: 'Test User',
      image: null,
      password: hashedPassword
    }
  })
  
  console.log('✅ Utilisateur de test créé:', testUser.id)
  return testUser
}

async function createUserForVenue(venueName, establishmentId) {
  const email = `${establishmentId}@monmariage.ai`
  const hashedPassword = await argon2.hash('Test123456!')
  
  return await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: venueName,
      image: null,
      password: hashedPassword
    }
  })
}

async function importVenues() {
  console.log('🏰 Importation des lieux de mariage...')
  
  const venuesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/venues.json'), 'utf8'))
  
  let imported = 0
  const maxVenues = 50 // Limiter pour éviter les erreurs
  
  for (let i = 0; i < Math.min(maxVenues, venuesData.venues.length); i++) {
    const venue = venuesData.venues[i]
    
    try {
      // Créer l'établissement d'abord pour avoir son ID
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
          latitude: venue.latitude || null,
          longitude: venue.longitude || null,
          maxCapacity: venue.maxCapacity || 100,
          minCapacity: venue.minCapacity || 10,
          surface: venue.surface || null,
          startingPrice: venue.startingPrice || null,
          currency: 'EUR',
          rating: venue.rating || 0,
          reviewCount: venue.reviewCount || 0,
          imageUrl: venue.images?.[0] || null,
          venueType: venue.venueType || 'DOMAIN',
          hasParking: venue.hasParking || false,
          hasGarden: venue.hasGarden || false,
          hasTerrace: venue.hasTerrace || false,
          hasKitchen: venue.hasKitchen || false,
          hasAccommodation: venue.hasAccommodation || false,
          userId: 'temp' // Temporaire, sera mis à jour après création de l'utilisateur
        }
      })
      
      // Créer l'utilisateur avec l'ID de l'établissement
      const user = await createUserForVenue(venue.name, establishment.id)
      
      // Mettre à jour l'établissement avec l'ID utilisateur
      await prisma.establishment.update({
        where: { id: establishment.id },
        data: { userId: user.id }
      })
      
      // Créer le storefront
      await prisma.partnerStorefront.create({
        data: {
          type: 'VENUE',
          isActive: true,
          logo: venue.images?.[0] || null,
          establishmentId: establishment.id,
          userId: user.id
        }
      })
      
      imported++
      if (imported % 10 === 0) {
        console.log(`📊 ${imported} lieux importés`)
      }
    } catch (error) {
      console.error(`Erreur pour ${venue.name}:`, error.message)
    }
  }
  
  console.log(`✅ ${imported} lieux de mariage importés`)
}

async function createUserForPartner(partnerName, partnerId) {
  const email = `${partnerId}@monmariage.ai`
  const hashedPassword = await argon2.hash('Test123456!')
  
  return await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: partnerName,
      image: null,
      password: hashedPassword
    }
  })
}

async function importVendors() {
  console.log('🎨 Importation des prestataires...')
  
  let totalImported = 0
  
  for (const [filename, type] of Object.entries(vendorTypes)) {
    try {
      console.log(`📁 Traitement de ${filename}.json...`)
      const vendorData = JSON.parse(fs.readFileSync(path.join(__dirname, `../data/${filename}.json`), 'utf8'))
      
      let imported = 0
      const maxItems = 20 // Limiter pour éviter les erreurs
      
      for (let i = 0; i < Math.min(maxItems, vendorData.vendors.length); i++) {
        const vendor = vendorData.vendors[i]
        
        try {
          // Créer le partenaire d'abord pour avoir son ID
          const partner = await prisma.partner.create({
            data: {
              companyName: vendor.name,
              description: vendor.description || 'Description non disponible',
              type: type,
              address: vendor.address || 'Adresse non spécifiée',
              city: vendor.city || 'Ville non spécifiée',
              region: vendor.region || 'Région non spécifiée',
              country: 'France',
              postalCode: vendor.postalCode || '00000',
              phone: vendor.phone || null,
              email: 'temp@monmariage.ai', // Temporaire
              website: vendor.website || null,
              rating: vendor.rating || 0,
              reviewCount: vendor.reviewCount || 0,
              logo: vendor.images?.[0] || null,
              userId: 'temp' // Temporaire
            }
          })
          
          // Créer l'utilisateur avec l'ID du partenaire
          const user = await createUserForPartner(vendor.name, partner.id)
          
          // Mettre à jour le partenaire avec l'ID utilisateur et l'email
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
              logo: vendor.images?.[0] || null,
              partnerId: partner.id,
              userId: user.id
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
    console.log('🚀 Début de l\'importation des données...')
    
    await importVenues()
    await importVendors()
    
    console.log('🎉 Importation terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

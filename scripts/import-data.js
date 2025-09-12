const { PrismaClient } = require('@prisma/client')
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
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      image: null
    }
  })
  
  console.log('✅ Utilisateur de test créé:', testUser.id)
  return testUser
}

async function importVenues() {
  console.log('🏰 Importation des lieux de mariage...')
  
  const venuesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/venues.json'), 'utf8'))
  const testUser = await createTestUser()
  
  let imported = 0
  const batchSize = 50
  
  for (let i = 0; i < venuesData.venues.length; i += batchSize) {
    const batch = venuesData.venues.slice(i, i + batchSize)
    
    const establishments = await Promise.all(batch.map(async (venue) => {
      try {
        // Créer l'établissement
        const establishment = await prisma.establishment.create({
          data: {
            name: venue.name,
            description: venue.description,
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
            userId: testUser.id
          }
        })
        
        // Créer le storefront
        await prisma.partnerStorefront.create({
          data: {
            type: 'VENUE',
            isActive: true,
            logo: venue.images?.[0] || null,
            establishmentId: establishment.id,
            userId: testUser.id
          }
        })
        
        // Créer les images
        if (venue.images && venue.images.length > 0) {
          await Promise.all(venue.images.slice(0, 10).map((imageUrl, index) => 
            prisma.image.create({
              data: {
                url: imageUrl,
                type: 'IMAGE',
                title: `${venue.name} - Image ${index + 1}`,
                order: index,
                establishmentId: establishment.id
              }
            }).catch(() => {}) // Ignorer les erreurs d'images
          ))
        }
        
        return establishment
      } catch (error) {
        console.error(`Erreur pour ${venue.name}:`, error.message)
        return null
      }
    }))
    
    imported += establishments.filter(e => e !== null).length
    console.log(`📊 ${imported}/${venuesData.venues.length} lieux importés`)
  }
  
  console.log(`✅ ${imported} lieux de mariage importés`)
}

async function importVendors() {
  console.log('🎨 Importation des prestataires...')
  
  const testUser = await createTestUser()
  let totalImported = 0
  
  for (const [filename, type] of Object.entries(vendorTypes)) {
    try {
      console.log(`📁 Traitement de ${filename}.json...`)
      const vendorData = JSON.parse(fs.readFileSync(path.join(__dirname, `../data/${filename}.json`), 'utf8'))
      
      let imported = 0
      const batchSize = 50
      
      for (let i = 0; i < vendorData.vendors.length; i += batchSize) {
        const batch = vendorData.vendors.slice(i, i + batchSize)
        
        const partners = await Promise.all(batch.map(async (vendor) => {
          try {
            // Créer le partenaire
            const partner = await prisma.partner.create({
              data: {
                companyName: vendor.name,
                description: vendor.description,
                type: type,
                address: vendor.address || 'Adresse non spécifiée',
                city: vendor.city || 'Ville non spécifiée',
                region: vendor.region || 'Région non spécifiée',
                country: 'France',
                postalCode: vendor.postalCode || '00000',
                phone: vendor.phone || null,
                email: vendor.email || `${vendor.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                website: vendor.website || null,
                rating: vendor.rating || 0,
                reviewCount: vendor.reviewCount || 0,
                logo: vendor.images?.[0] || null,
                userId: testUser.id
              }
            })
            
            // Créer le storefront
            await prisma.partnerStorefront.create({
              data: {
                type: 'PARTNER',
                isActive: true,
                logo: vendor.images?.[0] || null,
                partnerId: partner.id,
                userId: testUser.id
              }
            })
            
            return partner
          } catch (error) {
            console.error(`Erreur pour ${vendor.name}:`, error.message)
            return null
          }
        }))
        
        imported += partners.filter(p => p !== null).length
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




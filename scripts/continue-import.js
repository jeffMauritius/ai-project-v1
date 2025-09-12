const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Types de prestataires selon le schéma actuel
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
      password: hashedPassword,
      role: 'PARTNER'
    }
  })
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
      password: hashedPassword,
      role: 'PARTNER'
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
      // Extraire les images
      const images = venue.images || []
      
      // Créer l'établissement avec la structure du schéma actuel
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
      
      // Créer l'utilisateur avec l'ID de l'établissement
      const user = await createUserForVenue(venue.name, establishment.id)
      
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
      if (imported % 10 === 0) {
        console.log(`📊 ${imported} lieux importés`)
      }
    } catch (error) {
      console.error(`Erreur pour ${venue.name}:`, error.message)
    }
  }
  
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
      const maxItems = 20 // Limiter pour éviter les erreurs
      
      for (let i = 0; i < Math.min(maxItems, vendorData.vendors.length); i++) {
        const vendor = vendorData.vendors[i]
        
        try {
          // Extraire les images
          const images = vendor.images || []
          
          // Créer le partenaire avec la structure du schéma actuel
          const partner = await prisma.partner.create({
            data: {
              companyName: vendor.name,
              description: vendor.description || 'Description non disponible',
              type: type,
              city: vendor.city || 'Ville non spécifiée',
              region: vendor.region || 'Région non spécifiée',
              country: 'France',
              phone: vendor.phone || null,
              email: 'temp@monmariage.ai', // Temporaire
              website: vendor.website || null,
              rating: parseFloat(vendor.rating) || 0,
              reviewCount: vendor.reviewCount || 0,
              logo: images[0] || null,
              images: images,
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

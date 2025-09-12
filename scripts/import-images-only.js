const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importVenuesWithImages() {
  console.log('🏰 Importation des lieux de mariage avec images...')
  
  const venuesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/venues.json'), 'utf8'))
  
  let imported = 0
  const maxVenues = 10 // Commençons petit pour tester
  
  for (let i = 0; i < Math.min(maxVenues, venuesData.venues.length); i++) {
    const venue = venuesData.venues[i]
    
    try {
      // Extraire les images
      const images = venue.images || []
      console.log(`📸 ${venue.name} - ${images.length} images trouvées`)
      
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
          images: images, // ← ICI LES IMAGES SONT IMPORTÉES
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
      
      // Créer le storefront avec images
      const storefront = await prisma.partnerStorefront.create({
        data: {
          type: 'VENUE',
          isActive: true,
          logo: images[0] || null,
          images: images, // ← ICI LES IMAGES SONT IMPORTÉES DANS LE STOREFRONT
          establishmentId: establishment.id
        }
      })
      
      console.log(`✅ ${venue.name} - Establishment: ${images.length} images, Storefront: ${storefront.images?.length || 0} images`)
      imported++
      
    } catch (error) {
      console.error(`❌ Erreur pour ${venue.name}:`, error.message)
    }
  }
  
  console.log(`✅ ${imported} lieux de mariage importés avec images`)
}

async function importVendorsWithImages() {
  console.log('🎨 Importation des prestataires avec images...')
  
  const vendorFiles = ['beauty', 'caterers', 'decorators']
  const vendorTypes = {
    'beauty': 'DECORATION',
    'caterers': 'TRAITEUR', 
    'decorators': 'DECORATION'
  }
  
  let totalImported = 0
  
  for (const filename of vendorFiles) {
    try {
      console.log(`📁 Traitement de ${filename}.json...`)
      const vendorData = JSON.parse(fs.readFileSync(path.join(__dirname, `../data/${filename}.json`), 'utf8'))
      
      let imported = 0
      const maxItems = 5 // Commençons petit pour tester
      
      for (let i = 0; i < Math.min(maxItems, vendorData.vendors.length); i++) {
        const vendor = vendorData.vendors[i]
        
        try {
          // Extraire les images
          const images = vendor.images || []
          console.log(`📸 ${vendor.name} - ${images.length} images trouvées`)
          
          // Créer le partenaire
          const partner = await prisma.partner.create({
            data: {
              companyName: vendor.name,
              description: vendor.description || 'Description non disponible',
              type: vendorTypes[filename],
              city: vendor.city || 'Ville non spécifiée',
              region: vendor.region || 'Région non spécifiée',
              country: 'France',
              phone: vendor.phone || null,
              email: 'temp@monmariage.ai',
              website: vendor.website || null,
              rating: parseFloat(vendor.rating) || 0,
              reviewCount: vendor.reviewCount || 0,
              logo: images[0] || null,
              images: images, // ← ICI LES IMAGES SONT IMPORTÉES
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
          
          // Créer le storefront avec images
          const storefront = await prisma.partnerStorefront.create({
            data: {
              type: 'PARTNER',
              isActive: true,
              logo: images[0] || null,
              images: images, // ← ICI LES IMAGES SONT IMPORTÉES DANS LE STOREFRONT
              partnerId: partner.id
            }
          })
          
          console.log(`✅ ${vendor.name} - Partner: ${images.length} images, Storefront: ${storefront.images?.length || 0} images`)
          imported++
          
        } catch (error) {
          console.error(`❌ Erreur pour ${vendor.name}:`, error.message)
        }
      }
      
      console.log(`✅ ${imported} prestataires ${vendorTypes[filename]} importés avec images`)
      totalImported += imported
    } catch (error) {
      console.error(`❌ Erreur lors de l'importation de ${filename}:`, error.message)
    }
  }
  
  console.log(`✅ ${totalImported} prestataires importés au total avec images`)
}

async function main() {
  try {
    console.log('🚀 Début de l\'importation FOCUS IMAGES...')
    
    await importVenuesWithImages()
    await importVendorsWithImages()
    
    console.log('🎉 Importation terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()




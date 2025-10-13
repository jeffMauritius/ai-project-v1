import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listRealCarRentals() {
  console.log('🚗 LISTE DES 21 VRAIS LOUEURS DE VOITURES EN BASE\n')

  try {
    // Récupérer tous les partenaires avec serviceType VOITURE
    const carRentals = await prisma.partner.findMany({
      where: {
        serviceType: 'VOITURE'
      },
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        description: true,
        billingCity: true,
        basePrice: true,
        services: true
      },
      orderBy: {
        companyName: 'asc'
      }
    })

    console.log(`📊 ${carRentals.length} partenaires avec serviceType VOITURE trouvés\n`)

    if (carRentals.length === 0) {
      console.log('❌ Aucun partenaire trouvé avec serviceType VOITURE')
      return
    }

    // Afficher chaque partenaire
    carRentals.forEach((partner, index) => {
      console.log(`${index + 1}. ${partner.companyName}`)
      console.log(`   ID: ${partner.id}`)
      console.log(`   ServiceType: ${partner.serviceType}`)
      console.log(`   Ville: ${partner.billingCity}`)
      console.log(`   Prix: ${partner.basePrice ? partner.basePrice + '€' : 'Non spécifié'}`)
      console.log(`   Services: ${partner.services?.join(', ') || 'Aucun'}`)
      console.log(`   Description: ${partner.description?.substring(0, 100)}...`)
      console.log('')
    })

    // Vérifier s'il y a des photographes mal classés
    console.log('🔍 VÉRIFICATION DES PHOTOGRAPHES MAL CLASSÉS:')
    const photographersAsCars = await prisma.partner.findMany({
      where: {
        serviceType: 'VOITURE',
        OR: [
          { companyName: { contains: 'Photo', mode: 'insensitive' } },
          { companyName: { contains: 'Photographe', mode: 'insensitive' } },
          { companyName: { contains: 'Photography', mode: 'insensitive' } },
          { companyName: { contains: 'Pix', mode: 'insensitive' } },
          { companyName: { contains: 'Shot', mode: 'insensitive' } },
          { description: { contains: 'photographe', mode: 'insensitive' } },
          { description: { contains: 'photographie', mode: 'insensitive' } },
          { description: { contains: 'photojournalist', mode: 'insensitive' } },
          { description: { contains: 'capture', mode: 'insensitive' } },
          { description: { contains: 'cliché', mode: 'insensitive' } },
          { description: { contains: 'reportage', mode: 'insensitive' } }
        ]
      },
      select: {
        companyName: true,
        serviceType: true,
        description: true
      }
    })

    if (photographersAsCars.length > 0) {
      console.log(`❌ ${photographersAsCars.length} photographes encore mal classés comme VOITURE:`)
      photographersAsCars.forEach((photographer, index) => {
        console.log(`   ${index + 1}. ${photographer.companyName}`)
        console.log(`      Description: ${photographer.description?.substring(0, 80)}...`)
      })
    } else {
      console.log('✅ Aucun photographe mal classé trouvé')
    }

    // Statistiques finales
    console.log('\n📊 STATISTIQUES:')
    console.log(`🚗 Total partenaires VOITURE: ${carRentals.length}`)
    console.log(`📸 Photographes mal classés: ${photographersAsCars.length}`)
    console.log(`✅ Vraies voitures: ${carRentals.length - photographersAsCars.length}`)

  } catch (error) {
    console.error('❌ Erreur lors de la récupération:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listRealCarRentals()





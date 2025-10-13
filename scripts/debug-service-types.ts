import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugServiceTypes() {
  console.log('🔍 Analyse des serviceType dans la base de données...\n')

  try {
    // 1. Compter les partenaires par serviceType
    const serviceTypeCounts = await prisma.partner.groupBy({
      by: ['serviceType'],
      _count: {
        serviceType: true
      },
      orderBy: {
        _count: {
          serviceType: 'desc'
        }
      }
    })

    console.log('📊 Nombre de partenaires par serviceType:')
    serviceTypeCounts.forEach(group => {
      console.log(`  ${group.serviceType}: ${group._count.serviceType}`)
    })

    // 2. Chercher des photographes mal classés
    console.log('\n🔍 Recherche de photographes mal classés...')
    const photographers = await prisma.partner.findMany({
      where: {
        OR: [
          { companyName: { contains: 'Photo', mode: 'insensitive' } },
          { companyName: { contains: 'Photographe', mode: 'insensitive' } },
          { companyName: { contains: 'Photography', mode: 'insensitive' } },
          { description: { contains: 'photographe', mode: 'insensitive' } },
          { description: { contains: 'photographie', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        description: true
      },
      take: 10
    })

    console.log(`\n📸 ${photographers.length} photographes potentiels trouvés:`)
    photographers.forEach(photographer => {
      const isCorrectlyClassified = photographer.serviceType === 'PHOTOGRAPHE'
      console.log(`  ${isCorrectlyClassified ? '✅' : '❌'} ${photographer.companyName} -> ${photographer.serviceType}`)
      if (!isCorrectlyClassified) {
        console.log(`    Description: ${photographer.description.substring(0, 100)}...`)
      }
    })

    // 3. Chercher des voitures mal classées
    console.log('\n🚗 Recherche de voitures mal classées...')
    const vehicles = await prisma.partner.findMany({
      where: {
        serviceType: 'VOITURE'
      },
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        description: true
      },
      take: 10
    })

    console.log(`\n🚗 ${vehicles.length} partenaires classés comme VOITURE:`)
    vehicles.forEach(vehicle => {
      const isActuallyVehicle = 
        vehicle.companyName.toLowerCase().includes('voiture') ||
        vehicle.companyName.toLowerCase().includes('car') ||
        vehicle.companyName.toLowerCase().includes('limousine') ||
        vehicle.description.toLowerCase().includes('voiture') ||
        vehicle.description.toLowerCase().includes('transport')
      
      console.log(`  ${isActuallyVehicle ? '✅' : '❌'} ${vehicle.companyName} -> ${vehicle.serviceType}`)
      if (!isActuallyVehicle) {
        console.log(`    Description: ${vehicle.description.substring(0, 100)}...`)
      }
    })

    // 4. Statistiques générales
    const totalPartners = await prisma.partner.count()
    const totalStorefronts = await prisma.partnerStorefront.count()
    
    console.log(`\n📊 Statistiques générales:`)
    console.log(`  Total partenaires: ${totalPartners}`)
    console.log(`  Total storefronts: ${totalStorefronts}`)

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugServiceTypes()

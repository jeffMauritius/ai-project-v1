import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixServiceTypeClassification() {
  console.log('🔧 Correction des classifications de serviceType...\n')

  try {
    let correctedCount = 0

    // 1. Corriger les photographes mal classés comme VOITURE
    console.log('📸 Correction des photographes mal classés comme VOITURE...')
    
    const photographersToFix = await prisma.partner.findMany({
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
        id: true,
        companyName: true,
        serviceType: true
      }
    })

    console.log(`📊 ${photographersToFix.length} photographes à corriger`)

    for (const photographer of photographersToFix) {
      await prisma.partner.update({
        where: { id: photographer.id },
        data: { serviceType: 'PHOTOGRAPHE' }
      })
      correctedCount++
      
      if (correctedCount % 100 === 0) {
        console.log(`  ✅ ${correctedCount} photographes corrigés...`)
      }
    }

    console.log(`✅ ${photographersToFix.length} photographes corrigés de VOITURE vers PHOTOGRAPHE`)

    // 2. Corriger les vidéastes mal classés
    console.log('\n🎥 Correction des vidéastes mal classés...')
    
    const videographersToFix = await prisma.partner.findMany({
      where: {
        serviceType: { not: 'VIDEO' },
        OR: [
          { companyName: { contains: 'Video', mode: 'insensitive' } },
          { companyName: { contains: 'Vidéaste', mode: 'insensitive' } },
          { companyName: { contains: 'Film', mode: 'insensitive' } },
          { description: { contains: 'vidéo', mode: 'insensitive' } },
          { description: { contains: 'film', mode: 'insensitive' } },
          { description: { contains: 'montage', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        companyName: true,
        serviceType: true
      }
    })

    console.log(`📊 ${videographersToFix.length} vidéastes à corriger`)

    for (const videographer of videographersToFix) {
      await prisma.partner.update({
        where: { id: videographer.id },
        data: { serviceType: 'VIDEO' }
      })
      correctedCount++
    }

    console.log(`✅ ${videographersToFix.length} vidéastes corrigés vers VIDEO`)

    // 3. Corriger les traiteurs mal classés
    console.log('\n🍽️ Correction des traiteurs mal classés...')
    
    const caterersToFix = await prisma.partner.findMany({
      where: {
        serviceType: { not: 'TRAITEUR' },
        OR: [
          { companyName: { contains: 'Traiteur', mode: 'insensitive' } },
          { companyName: { contains: 'Catering', mode: 'insensitive' } },
          { companyName: { contains: 'Cuisine', mode: 'insensitive' } },
          { description: { contains: 'traiteur', mode: 'insensitive' } },
          { description: { contains: 'catering', mode: 'insensitive' } },
          { description: { contains: 'cuisine', mode: 'insensitive' } },
          { description: { contains: 'gastronomie', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        companyName: true,
        serviceType: true
      }
    })

    console.log(`📊 ${caterersToFix.length} traiteurs à corriger`)

    for (const caterer of caterersToFix) {
      await prisma.partner.update({
        where: { id: caterer.id },
        data: { serviceType: 'TRAITEUR' }
      })
      correctedCount++
    }

    console.log(`✅ ${caterersToFix.length} traiteurs corrigés vers TRAITEUR`)

    // 4. Corriger les DJ/musiciens mal classés
    console.log('\n🎵 Correction des DJ/musiciens mal classés...')
    
    const musiciansToFix = await prisma.partner.findMany({
      where: {
        serviceType: { not: 'MUSIQUE' },
        OR: [
          { companyName: { contains: 'DJ', mode: 'insensitive' } },
          { companyName: { contains: 'Music', mode: 'insensitive' } },
          { companyName: { contains: 'Musique', mode: 'insensitive' } },
          { companyName: { contains: 'Orchestre', mode: 'insensitive' } },
          { description: { contains: 'dj', mode: 'insensitive' } },
          { description: { contains: 'musique', mode: 'insensitive' } },
          { description: { contains: 'orchestre', mode: 'insensitive' } },
          { description: { contains: 'sonorisation', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        companyName: true,
        serviceType: true
      }
    })

    console.log(`📊 ${musiciansToFix.length} musiciens à corriger`)

    for (const musician of musiciansToFix) {
      await prisma.partner.update({
        where: { id: musician.id },
        data: { serviceType: 'MUSIQUE' }
      })
      correctedCount++
    }

    console.log(`✅ ${musiciansToFix.length} musiciens corrigés vers MUSIQUE`)

    // 5. Statistiques finales
    console.log('\n📊 Statistiques finales:')
    console.log(`🔧 Total des corrections: ${correctedCount}`)

    // Vérification des résultats
    const finalCounts = await prisma.partner.groupBy({
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

    console.log('\n📊 Nouveaux comptages par serviceType:')
    finalCounts.forEach(group => {
      console.log(`  ${group.serviceType}: ${group._count.serviceType}`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixServiceTypeClassification()





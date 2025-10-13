import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPhotographersClassification() {
  console.log('🔧 CORRECTION DES PHOTOGRAPHES MAL CLASSÉS\n')

  try {
    // 1. Identifier tous les photographes mal classés comme VOITURE
    console.log('🔍 Recherche des photographes mal classés...')
    
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

    if (photographersToFix.length === 0) {
      console.log('✅ Aucun photographe mal classé trouvé')
      return
    }

    // 2. Afficher quelques exemples
    console.log('\n📋 Exemples de photographes mal classés:')
    photographersToFix.slice(0, 5).forEach((photographer, index) => {
      console.log(`  ${index + 1}. ${photographer.companyName} -> ${photographer.serviceType}`)
    })

    // 3. Demander confirmation
    console.log(`\n⚠️ Êtes-vous sûr de vouloir corriger ${photographersToFix.length} photographes ?`)
    console.log('   Ils seront changés de VOITURE vers PHOTOGRAPHE')
    
    // 4. Effectuer la correction
    console.log('\n🔧 Correction en cours...')
    
    let correctedCount = 0
    for (const photographer of photographersToFix) {
      await prisma.partner.update({
        where: { id: photographer.id },
        data: { serviceType: 'PHOTOGRAPHE' }
      })
      correctedCount++
      
      if (correctedCount % 100 === 0) {
        console.log(`  ✅ ${correctedCount}/${photographersToFix.length} corrigés...`)
      }
    }

    console.log(`\n🎉 CORRECTION TERMINÉE !`)
    console.log(`✅ ${correctedCount} photographes corrigés de VOITURE vers PHOTOGRAPHE`)

    // 5. Vérification finale
    console.log('\n🔍 Vérification finale...')
    const remainingPhotographersAsVehicles = await prisma.partner.count({
      where: {
        serviceType: 'VOITURE',
        OR: [
          { companyName: { contains: 'Photo', mode: 'insensitive' } },
          { companyName: { contains: 'Photographe', mode: 'insensitive' } }
        ]
      }
    })

    console.log(`📊 Photographes encore mal classés: ${remainingPhotographersAsVehicles}`)

    // 6. Nouveaux comptages
    const newCounts = await prisma.partner.groupBy({
      by: ['serviceType'],
      _count: { serviceType: true },
      where: {
        serviceType: { in: ['PHOTOGRAPHE', 'VOITURE'] }
      }
    })

    console.log('\n📊 Nouveaux comptages:')
    newCounts.forEach(group => {
      console.log(`  ${group.serviceType}: ${group._count.serviceType}`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPhotographersClassification()

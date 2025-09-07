import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkGeocodingStatus() {
  console.log('🌍 Vérification du statut de géolocalisation...\n')
  
  try {
    // Vérifier les établissements
    const totalEstablishments = await prisma.establishment.count()
    const establishmentsWithCoords = await prisma.establishment.count({
      where: {
        AND: [
          { latitude: { not: { equals: null } } },
          { longitude: { not: { equals: null } } }
        ]
      }
    })
    const establishmentsWithoutCoords = totalEstablishments - establishmentsWithCoords

    // Vérifier les partenaires
    const totalPartners = await prisma.partner.count()
    const partnersWithCoords = await prisma.partner.count({
      where: {
        AND: [
          { latitude: { not: { equals: null } } },
          { longitude: { not: { equals: null } } }
        ]
      }
    })
    const partnersWithoutCoords = totalPartners - partnersWithCoords

    // Afficher les statistiques
    console.log('📊 STATISTIQUES DE GÉOLOCALISATION')
    console.log('=' .repeat(50))
    console.log(`🏛️  ÉTABLISSEMENTS:`)
    console.log(`  - Total: ${totalEstablishments}`)
    console.log(`  - Avec coordonnées: ${establishmentsWithCoords}`)
    console.log(`  - Sans coordonnées: ${establishmentsWithoutCoords}`)
    console.log(`  - Taux de géolocalisation: ${((establishmentsWithCoords / totalEstablishments) * 100).toFixed(1)}%`)

    console.log(`\n🤝 PARTENAIRES:`)
    console.log(`  - Total: ${totalPartners}`)
    console.log(`  - Avec coordonnées: ${partnersWithCoords}`)
    console.log(`  - Sans coordonnées: ${partnersWithoutCoords}`)
    console.log(`  - Taux de géolocalisation: ${((partnersWithCoords / totalPartners) * 100).toFixed(1)}%`)

    const totalEntities = totalEstablishments + totalPartners
    const totalWithCoords = establishmentsWithCoords + partnersWithCoords
    const totalWithoutCoords = establishmentsWithoutCoords + partnersWithoutCoords

    console.log(`\n📈 RÉSUMÉ GLOBAL:`)
    console.log(`  - Total entités: ${totalEntities}`)
    console.log(`  - Géolocalisées: ${totalWithCoords}`)
    console.log(`  - À géolocaliser: ${totalWithoutCoords}`)
    console.log(`  - Taux global: ${((totalWithCoords / totalEntities) * 100).toFixed(1)}%`)

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS')
    console.log('=' .repeat(50))

    if (totalWithoutCoords === 0) {
      console.log('✅ Toutes les entités sont géolocalisées !')
    } else if (totalWithoutCoords < 100) {
      console.log('🟡 Peu d\'entités à géolocaliser - processus rapide')
      console.log('   Commande: npm run geocoding:run')
    } else if (totalWithoutCoords < 1000) {
      console.log('🟠 Nombre modéré d\'entités à géolocaliser')
      console.log('   Commande: npm run geocoding:run')
      console.log('   ⏱️  Temps estimé: 10-20 minutes')
    } else {
      console.log('🔴 Beaucoup d\'entités à géolocaliser')
      console.log('   Commande: npm run geocoding:run')
      console.log('   ⏱️  Temps estimé: 1-3 heures')
      console.log('   ⚠️  Le processus peut être interrompu et repris')
    }

    // Exemples d'entités sans coordonnées
    if (totalWithoutCoords > 0) {
      console.log('\n📋 EXEMPLES D\'ENTITÉS SANS COORDONNÉES:')
      console.log('=' .repeat(50))

      if (establishmentsWithoutCoords > 0) {
        const sampleEstablishments = await prisma.establishment.findMany({
          where: {
            OR: [
              { latitude: { equals: null } },
              { longitude: { equals: null } }
            ]
          },
          take: 3,
          select: { name: true, address: true, city: true }
        })

        console.log('🏛️  Établissements:')
        sampleEstablishments.forEach((est, i) => {
          console.log(`  ${i + 1}. ${est.name} - ${est.address}, ${est.city}`)
        })
      }

      if (partnersWithoutCoords > 0) {
        const samplePartners = await prisma.partner.findMany({
          where: {
            OR: [
              { latitude: { equals: null } },
              { longitude: { equals: null } }
            ]
          },
          take: 3,
          select: { companyName: true, billingStreet: true, billingCity: true }
        })

        console.log('\n🤝 Partenaires:')
        samplePartners.forEach((partner, i) => {
          console.log(`  ${i + 1}. ${partner.companyName} - ${partner.billingStreet}, ${partner.billingCity}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  checkGeocodingStatus()
    .then(() => {
      console.log('\n✅ Vérification terminée !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { checkGeocodingStatus }

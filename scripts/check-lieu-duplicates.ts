import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLieuDuplicates() {
  console.log('🔍 Vérification des doublons entre Partners LIEU et Establishments...')
  
  try {
    // Récupérer tous les partenaires de type LIEU
    const lieuPartners = await prisma.partner.findMany({
      where: {
        serviceType: 'LIEU'
      },
      select: {
        id: true,
        companyName: true,
        billingCity: true,
        billingCountry: true,
        storefronts: {
          select: {
            id: true
          }
        }
      },
      take: 20 // Analyser un échantillon d'abord
    })

    console.log(`📊 ${lieuPartners.length} partenaires LIEU analysés (échantillon)`)

    let duplicatesFound = 0
    let exactMatches = 0
    let similarMatches = 0

    console.log('\n🔍 ANALYSE DES DOUBLONS POTENTIELS:')
    console.log('=====================================')

    for (const partner of lieuPartners) {
      const partnerName = partner.companyName?.toLowerCase().trim()
      const partnerCity = partner.billingCity?.toLowerCase().trim()

      if (!partnerName) continue

      // Chercher des établissements avec un nom similaire
      const similarEstablishments = await prisma.establishment.findMany({
        where: {
          OR: [
            {
              name: {
                contains: partnerName,
                mode: 'insensitive'
              }
            },
            {
              name: {
                contains: partnerName.split(' ')[0], // Premier mot
                mode: 'insensitive'
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          city: true,
          region: true,
          type: true
        }
      })

      if (similarEstablishments.length > 0) {
        console.log(`\n🏢 Partenaire: ${partner.companyName}`)
        console.log(`   📍 Ville: ${partner.billingCity}, ${partner.billingCountry}`)
        console.log(`   🆔 Partner ID: ${partner.id}`)
        console.log(`   🏪 Storefront ID: ${partner.storefronts?.[0]?.id || 'N/A'}`)
        
        console.log(`   🔍 Établissements similaires trouvés:`)
        similarEstablishments.forEach((est, index) => {
          const isExactMatch = est.name.toLowerCase().trim() === partnerName
          const isCityMatch = est.city?.toLowerCase().trim() === partnerCity
          
          if (isExactMatch) {
            exactMatches++
            console.log(`     ✅ ${index + 1}. ${est.name} (EXACT MATCH)`)
          } else {
            similarMatches++
            console.log(`     🔸 ${index + 1}. ${est.name}`)
          }
          console.log(`        📍 ${est.city}, ${est.region}`)
          console.log(`        🏷️ Type: ${est.type}`)
          console.log(`        🆔 ID: ${est.id}`)
        })
        
        duplicatesFound++
      }
    }

    console.log('\n📊 RÉSUMÉ DE L\'ANALYSE:')
    console.log('========================')
    console.log(`🔍 Partenaires LIEU analysés: ${lieuPartners.length}`)
    console.log(`🔄 Doublons potentiels trouvés: ${duplicatesFound}`)
    console.log(`✅ Correspondances exactes: ${exactMatches}`)
    console.log(`🔸 Correspondances similaires: ${similarMatches}`)
    console.log(`📈 Taux de doublons: ${((duplicatesFound / lieuPartners.length) * 100).toFixed(1)}%`)

    // Vérifier aussi le total des partenaires LIEU
    const totalLieuPartners = await prisma.partner.count({
      where: {
        serviceType: 'LIEU'
      }
    })

    const totalEstablishments = await prisma.establishment.count()

    console.log('\n📈 STATISTIQUES GÉNÉRALES:')
    console.log('===========================')
    console.log(`👥 Total partenaires LIEU: ${totalLieuPartners}`)
    console.log(`🏢 Total établissements: ${totalEstablishments}`)
    console.log(`📊 Ratio LIEU/Establishments: ${(totalLieuPartners / totalEstablishments * 100).toFixed(1)}%`)

    if (duplicatesFound > 0) {
      console.log('\n⚠️  RECOMMANDATIONS:')
      console.log('===================')
      console.log('1. Les partenaires LIEU semblent être des doublons des établissements')
      console.log('2. Il est recommandé de les exclure de l\'API prestataires')
      console.log('3. Les utilisateurs doivent utiliser la page "Établissements" pour les lieux')
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse des doublons:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  checkLieuDuplicates()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

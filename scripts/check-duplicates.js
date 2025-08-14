const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDuplicates() {
  try {
    console.log('🔍 Vérification des doublons de vitrines...\n')

    // Récupérer tous les partenaires avec leurs vitrines
    const partners = await prisma.partner.findMany({
      include: {
        storefronts: {
          include: {
            media: true
          }
        }
      }
    })

    console.log(`📊 Total des partenaires: ${partners.length}`)

    // Analyser les doublons
    partners.forEach(partner => {
      if (partner.storefronts.length > 1) {
        console.log(`\n⚠️  DOUBLONS DÉTECTÉS pour le partenaire: ${partner.companyName} (${partner.serviceType})`)
        console.log(`   ID Partenaire: ${partner.id}`)
        console.log(`   Nombre de vitrines: ${partner.storefronts.length}`)
        
        partner.storefronts.forEach((storefront, index) => {
          console.log(`   Vitrine ${index + 1}:`)
          console.log(`     ID: ${storefront.id}`)
          console.log(`     Type: ${storefront.type}`)
          console.log(`     Actif: ${storefront.isActive}`)
          console.log(`     Créé: ${storefront.createdAt}`)
          console.log(`     Médias: ${storefront.media.length}`)
          console.log(`     URL: http://localhost:3000/storefront/${storefront.id}`)
        })
      }
    })

    // Vérifier les vitrines orphelines (sans partenaire)
    const orphanStorefronts = await prisma.partnerStorefront.findMany({
      where: {
        partnerId: null
      }
    })

    if (orphanStorefronts.length > 0) {
      console.log(`\n⚠️  VITRINES ORPHELINES: ${orphanStorefronts.length}`)
      orphanStorefronts.forEach(storefront => {
        console.log(`   ID: ${storefront.id}, Type: ${storefront.type}`)
      })
    }

    // Statistiques générales
    const totalStorefronts = await prisma.partnerStorefront.count()
    console.log(`\n📈 Statistiques:`)
    console.log(`   Total des vitrines: ${totalStorefronts}`)
    console.log(`   Partenaires avec doublons: ${partners.filter(p => p.storefronts.length > 1).length}`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicates() 
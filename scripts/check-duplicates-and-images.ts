import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDuplicatesAndImages() {
  try {
    console.log('🔍 Vérification des doublons et images...')
    
    // 1. Vérifier les partenaires avec serviceType "LIEU"
    console.log('\n📊 PARTENAIRES AVEC SERVICE TYPE "LIEU":')
    const partnersWithLieu = await prisma.partner.findMany({
      where: { serviceType: 'LIEU' },
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        images: true
      },
      take: 10
    })
    
    console.log(`Total partenaires LIEU: ${partnersWithLieu.length}`)
    partnersWithLieu.forEach(partner => {
      console.log(`- ${partner.companyName} (${partner.id}) - Images: ${partner.images?.length || 0}`)
    })
    
    // 2. Vérifier si ces partenaires existent aussi comme établissements
    console.log('\n🔍 VÉRIFICATION DES DOUBLONS:')
    for (const partner of partnersWithLieu.slice(0, 5)) {
      const establishment = await prisma.establishment.findFirst({
        where: {
          name: { contains: partner.companyName, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          type: true,
          images: true
        }
      })
      
      if (establishment) {
        console.log(`❌ DOUBLON: ${partner.companyName} existe aussi comme établissement (${establishment.name})`)
        console.log(`   - Partenaire images: ${partner.images?.length || 0}`)
        console.log(`   - Établissement images: ${establishment.images?.length || 0}`)
      } else {
        console.log(`✅ Pas de doublon: ${partner.companyName}`)
      }
    }
    
    // 3. Vérifier les images des établissements
    console.log('\n🖼️ VÉRIFICATION DES IMAGES DES ÉTABLISSEMENTS:')
    const establishmentsSample = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        images: true
      },
      take: 20
    })
    
    let withImages = 0
    let withoutImages = 0
    
    establishmentsSample.forEach(establishment => {
      if (establishment.images && establishment.images.length > 0) {
        withImages++
        console.log(`✅ ${establishment.name} - ${establishment.images.length} images`)
      } else {
        withoutImages++
        console.log(`❌ ${establishment.name} - AUCUNE IMAGE`)
      }
    })
    
    console.log(`\n📊 RÉSUMÉ ÉCHANTILLON (${establishmentsSample.length} établissements):`)
    console.log(`- Avec images: ${withImages}`)
    console.log(`- Sans images: ${withoutImages}`)
    console.log(`- Pourcentage avec images: ${((withImages / establishmentsSample.length) * 100).toFixed(1)}%`)
    
    // 4. Compter tous les établissements avec/sans images
    console.log('\n📊 COMPTAGE GLOBAL DES ÉTABLISSEMENTS:')
    const totalEstablishments = await prisma.establishment.count()
    const establishmentsWithImages = await prisma.establishment.count({
      where: {
        images: { isEmpty: false }
      }
    })
    const establishmentsWithoutImages = totalEstablishments - establishmentsWithImages
    
    console.log(`- Total établissements: ${totalEstablishments}`)
    console.log(`- Avec images: ${establishmentsWithImages}`)
    console.log(`- Sans images: ${establishmentsWithoutImages}`)
    console.log(`- Pourcentage avec images: ${((establishmentsWithImages / totalEstablishments) * 100).toFixed(1)}%`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicatesAndImages()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzePartnerImages() {
  console.log('🔍 Analyse des images des partenaires...')
  
  try {
    // Récupérer un échantillon de partenaires avec leurs images
    const partners = await prisma.partner.findMany({
      where: {
        serviceType: {
          not: 'LIEU' // Exclure les LIEU
        }
      },
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        storefronts: {
          select: {
            id: true,
            images: true
          }
        }
      },
      take: 10
    })

    console.log(`📊 ${partners.length} partenaires analysés`)

    let withImages = 0
    let withoutImages = 0
    let totalImages = 0

    console.log('\n🔍 DÉTAIL DES PARTENAIRES:')
    console.log('==========================')

    for (const partner of partners) {
      const storefront = partner.storefronts?.[0]
      const imageCount = storefront?.images?.length || 0
      
      console.log(`${partners.indexOf(partner) + 1}. ${partner.companyName}`)
      console.log(`   Type: ${partner.serviceType}`)
      console.log(`   Storefront ID: ${storefront?.id || 'N/A'}`)
      console.log(`   Images: ${imageCount}`)
      
      if (imageCount > 0) {
        withImages++
        totalImages += imageCount
        console.log(`   Première image: ${storefront?.images?.[0]}`)
      } else {
        withoutImages++
        console.log(`   ❌ Aucune image`)
      }
      console.log('')
    }

    console.log('\n📊 STATISTIQUES:')
    console.log('================')
    console.log(`Total partenaires analysés: ${partners.length}`)
    console.log(`Avec images: ${withImages}`)
    console.log(`Sans images: ${withoutImages}`)
    console.log(`Total images: ${totalImages}`)
    console.log(`Taux de partenaires avec images: ${((withImages/partners.length)*100).toFixed(1)}%`)

    // Vérifier le total des partenaires avec images
    const totalPartnersWithImages = await prisma.partner.count({
      where: {
        serviceType: {
          not: 'LIEU'
        },
        storefronts: {
          some: {
            images: {
              isEmpty: false
            }
          }
        }
      }
    })

    const totalPartners = await prisma.partner.count({
      where: {
        serviceType: {
          not: 'LIEU'
        }
      }
    })

    console.log('\n📈 STATISTIQUES GÉNÉRALES:')
    console.log('===========================')
    console.log(`Total partenaires (sans LIEU): ${totalPartners}`)
    console.log(`Partenaires avec images: ${totalPartnersWithImages}`)
    console.log(`Taux global avec images: ${((totalPartnersWithImages/totalPartners)*100).toFixed(1)}%`)

    if (totalPartnersWithImages < totalPartners * 0.5) {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ:')
      console.log('====================')
      console.log('Moins de 50% des partenaires ont des images')
      console.log('Il est recommandé de:')
      console.log('1. Vérifier le script d\'upload des images des partenaires')
      console.log('2. Relancer l\'upload si nécessaire')
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse des images des partenaires:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  analyzePartnerImages()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}


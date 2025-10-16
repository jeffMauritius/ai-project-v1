import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkIfEstablishment() {
  try {
    const entityId = '68bfa7178ee56a699c75b0fc'
    console.log(`🔍 Vérification si ${entityId} est un établissement`)

    const establishment = await prisma.establishment.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        name: true,
        type: true,
        images: true,
        city: true,
        region: true
      }
    })

    if (establishment) {
      console.log(`✅ Trouvé dans Establishment:`)
      console.log(`   ID: ${establishment.id}`)
      console.log(`   Nom: ${establishment.name}`)
      console.log(`   Type: ${establishment.type}`)
      console.log(`   Ville: ${establishment.city}`)
      console.log(`   Région: ${establishment.region}`)
      console.log(`   Images: ${establishment.images?.length || 0}`)

      if (establishment.images && establishment.images.length > 0) {
        console.log(`\n📸 IMAGES DE L'ÉTABLISSEMENT:`)
        establishment.images.forEach((url, index) => {
          console.log(`${index + 1}. ${url}`)
        })

        // Analyser les URLs
        const vercelUrls = establishment.images.filter(url => url.includes('vercel-storage.com'))
        const mariagesUrls = establishment.images.filter(url => url.includes('mariages.net'))
        const otherUrls = establishment.images.filter(url => !url.includes('vercel-storage.com') && !url.includes('mariages.net'))

        console.log(`\n🔗 ANALYSE DES URLs:`)
        console.log(`===================`)
        console.log(`URLs Vercel Blob: ${vercelUrls.length}`)
        console.log(`URLs Mariages.net: ${mariagesUrls.length}`)
        console.log(`Autres URLs: ${otherUrls.length}`)

        if (vercelUrls.length > 0) {
          console.log(`\n✅ URLs VERCEL BLOB:`)
          vercelUrls.forEach((url, index) => {
            console.log(`${index + 1}. ${url}`)
          })
        }

        if (mariagesUrls.length > 0) {
          console.log(`\n⚠️ URLs MARIAGES.NET:`)
          mariagesUrls.forEach((url, index) => {
            console.log(`${index + 1}. ${url}`)
          })
        }
      }
    } else {
      console.log(`❌ Pas trouvé dans Establishment non plus`)
      
      // Chercher des établissements similaires
      const similarEstablishments = await prisma.establishment.findMany({
        where: {
          id: {
            startsWith: '68bfa7178ee56a699c75b0f'
          }
        },
        take: 5,
        select: {
          id: true,
          name: true,
          type: true
        }
      })

      if (similarEstablishments.length > 0) {
        console.log(`\n🔍 Établissements similaires trouvés:`)
        similarEstablishments.forEach((est, index) => {
          console.log(`${index + 1}. ${est.id} - ${est.name} (${est.type})`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkIfEstablishment().catch(console.error)

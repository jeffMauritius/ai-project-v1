import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkEstablishment(establishmentName: string) {
  try {
    console.log(`🔍 Vérification de l'établissement: ${establishmentName}`)

    const establishment = await prisma.establishment.findFirst({
      where: {
        name: establishmentName
      },
      include: {
        Images: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!establishment) {
      console.log(`❌ Aucun établissement trouvé pour: ${establishmentName}`)
      return
    }

    console.log(`\n✅ Établissement trouvé:`)
    console.log(`   📋 Nom: ${establishment.name}`)
    console.log(`   📧 ID: ${establishment.id}`)
    console.log(`   📍 Type: ${establishment.type}`)
    console.log(`   📍 Ville: ${establishment.city}`)
    console.log(`   📍 Région: ${establishment.region}`)
    console.log(`   📍 Pays: ${establishment.country}`)
    console.log(`   💰 Prix: ${establishment.startingPrice} ${establishment.currency}`)
    console.log(`   👥 Capacité: ${establishment.maxCapacity}`)
    console.log(`   🖼️  Image URL: ${establishment.imageUrl}`)
    console.log(`   📊 Nombre d'images: ${establishment.images?.length || 0}`)
    console.log(`   📊 Nombre d'Images (relation): ${establishment.Images?.length || 0}`)

    if (establishment.images && establishment.images.length > 0) {
      console.log(`\n🖼️  Images (array):`)
      establishment.images.forEach((image, index) => {
        console.log(`   ${index + 1}. ${image}`)
      })
    }

    if (establishment.Images && establishment.Images.length > 0) {
      console.log(`\n🖼️  Images (relation):`)
      establishment.Images.forEach((image, index) => {
        console.log(`   ${index + 1}. ${image.url} (ordre: ${image.order})`)
      })
    }

    if (establishment.imageUrl && establishment.imageUrl !== '/placeholder-venue.jpg') {
      console.log(`\n🖼️  Image principale: ${establishment.imageUrl}`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Vérifier l'établissement "Château des Bordes"
checkEstablishment("Château des Bordes") 
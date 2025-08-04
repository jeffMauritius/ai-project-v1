import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMedia(companyName: string) {
  try {
    console.log(`🔍 Vérification des médias pour: ${companyName}`)

    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        companyName: companyName
      },
      include: {
        media: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!storefront) {
      console.log(`❌ Aucune vitrine trouvée pour: ${companyName}`)
      return
    }

    console.log(`\n✅ Vitrine trouvée:`)
    console.log(`   📋 Nom: ${storefront.companyName}`)
    console.log(`   📧 ID: ${storefront.id}`)
    console.log(`   📊 Nombre de médias: ${storefront.media.length}`)

    if (storefront.media.length === 0) {
      console.log(`   ❌ Aucun média trouvé`)
    } else {
      console.log(`\n📷 Médias associés:`)
      storefront.media.forEach((media, index) => {
        console.log(`   ${index + 1}. ${media.title || 'Sans titre'}`)
        console.log(`      📍 URL: ${media.url}`)
        console.log(`      📝 Description: ${media.description || 'Aucune description'}`)
        console.log(`      🔢 Ordre: ${media.order}`)
        console.log(`      📅 Créé: ${media.createdAt}`)
        console.log(`      📅 Modifié: ${media.updatedAt}`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Vérifier les médias pour "Château des Bordes"
checkMedia("Château des Bordes") 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkFavoritesImages() {
  try {
    console.log('🔍 Vérification des images des favoris...')

    // Récupérer un utilisateur existant
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé.')
      return
    }

    console.log(`👤 Utilisateur: ${user.email}`)

    // Récupérer tous les favoris
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id }
    })

    console.log(`\n💖 ${favorites.length} favoris trouvés:`)
    favorites.forEach((favorite, index) => {
      console.log(`${index + 1}. ${favorite.name}`)
      console.log(`   - StorefrontId: ${favorite.storefrontId}`)
      console.log(`   - ImageUrl: ${favorite.imageUrl || 'AUCUNE IMAGE'}`)
      console.log(`   - Description: ${favorite.description}`)
      console.log('')
    })

    // Vérifier les storefronts correspondants
    console.log('🏪 Vérification des storefronts correspondants:')
    for (const favorite of favorites) {
      const storefront = await prisma.partnerStorefront.findUnique({
        where: { id: favorite.storefrontId },
        include: {
          media: {
            take: 1,
            orderBy: { order: 'asc' }
          }
        }
      })

      if (storefront) {
        console.log(`✅ ${favorite.name}:`)
        console.log(`   - Storefront trouvé: ${storefront.id}`)
        console.log(`   - Media count: ${storefront.media.length}`)
        if (storefront.media.length > 0) {
          console.log(`   - Première image: ${storefront.media[0].url}`)
        } else {
          console.log(`   - Aucune image dans le storefront`)
        }
      } else {
        console.log(`❌ ${favorite.name}: Storefront non trouvé`)
      }
      console.log('')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkFavoritesImages() 
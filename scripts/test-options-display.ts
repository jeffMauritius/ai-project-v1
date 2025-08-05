import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testOptionsDisplay() {
  try {
    console.log('=== Test Options Display ===')
    
    // Récupérer tous les storefronts
    const storefronts = await prisma.partnerStorefront.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`\nNombre de storefronts trouvés: ${storefronts.length}`)
    
    storefronts.forEach((storefront, index) => {
      console.log(`\n--- Storefront ${index + 1} ---`)
      console.log(`ID: ${storefront.id}`)
      console.log(`Nom: ${storefront.companyName}`)
      console.log(`Type de service: ${storefront.serviceType}`)
      console.log(`Utilisateur: ${storefront.user?.name} (${storefront.user?.email})`)
      console.log(`Options:`, JSON.stringify(storefront.options, null, 2))
      console.log(`SearchableOptions:`, JSON.stringify(storefront.searchableOptions, null, 2))
    })
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testOptionsDisplay() 
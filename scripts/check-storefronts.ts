import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStorefronts() {
  try {
    console.log('🔍 Vérification des storefronts existants...\n')
    
    // Récupérer tous les storefronts
    const storefronts = await prisma.partnerStorefront.findMany({
      select: {
        id: true,
        type: true,
        establishment: {
          select: {
            id: true,
            name: true
          }
        },
        partner: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    })
    
    console.log(`📊 Total des storefronts: ${storefronts.length}\n`)
    
    if (storefronts.length === 0) {
      console.log('❌ Aucun storefront trouvé!')
      return
    }
    
    // Afficher les 10 premiers storefronts
    console.log('📋 Premiers storefronts:')
    storefronts.slice(0, 10).forEach((storefront, index) => {
      const name = storefront.type === 'VENUE' 
        ? storefront.establishment?.name 
        : storefront.partner?.companyName
      console.log(`${index + 1}. ID: ${storefront.id}`)
      console.log(`   Type: ${storefront.type}`)
      console.log(`   Nom: ${name}`)
      console.log('')
    })
    
    // Vérifier l'ID spécifique qui cause l'erreur
    const targetId = '68b65114fe5f4fb71c6aad26'
    const targetStorefront = storefronts.find(s => s.id === targetId)
    
    if (targetStorefront) {
      console.log(`✅ Storefront ${targetId} trouvé!`)
    } else {
      console.log(`❌ Storefront ${targetId} NON trouvé!`)
      console.log('IDs disponibles:', storefronts.map(s => s.id).slice(0, 5))
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStorefronts()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPartnerDescriptions() {
  try {
    // Récupérer quelques vitrines partenaires pour vérifier
    const storefronts = await prisma.partnerStorefront.findMany({
      select: {
        id: true,
        companyName: true,
        description: true
      },
      take: 3
    })

    console.log(`📊 Vérification de ${storefronts.length} vitrines partenaires:\n`)

    for (const storefront of storefronts) {
      console.log(`🏢 ${storefront.companyName}`)
      console.log(`📝 Description (${storefront.description.length} caractères):`)
      console.log('='.repeat(80))
      console.log(storefront.description)
      console.log('='.repeat(80))
      
      // Compter les retours à la ligne
      const lineBreaks = (storefront.description.match(/\n/g) || []).length
      console.log(`📊 Statistiques:`)
      console.log(`   - Nombre de retours à la ligne: ${lineBreaks}`)
      console.log(`   - Nombre de points: ${(storefront.description.match(/\./g) || []).length}`)
      
      // Vérifier si la description contient des retours à la ligne doubles
      const hasDoubleLineBreaks = storefront.description.includes('\n\n')
      console.log(`   - Contient des retours à la ligne doubles: ${hasDoubleLineBreaks ? '✅ Oui' : '❌ Non'}`)
      console.log('\n')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPartnerDescriptions() 
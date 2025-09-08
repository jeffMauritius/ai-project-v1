import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanAddresses() {
  console.log('🧹 Début du nettoyage des adresses...')
  
  try {
    // Nettoyer les établissements
    console.log('🏛️  Nettoyage des établissements...')
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        city: true
      }
    })
    
    let establishmentsUpdated = 0
    for (const establishment of establishments) {
      const updates: any = {}
      
      if (establishment.address?.startsWith('·')) {
        updates.address = establishment.address.substring(1).trim()
      }
      if (establishment.city?.startsWith('·')) {
        updates.city = establishment.city.substring(1).trim()
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.establishment.update({
          where: { id: establishment.id },
          data: updates
        })
        establishmentsUpdated++
        console.log(`  ✅ ${establishment.name}: ${Object.keys(updates).join(', ')} nettoyés`)
      }
    }
    
    console.log(`🏛️  ${establishmentsUpdated} établissements mis à jour`)
    
    // Nettoyer les partenaires
    console.log('👥 Nettoyage des partenaires...')
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        billingCity: true
      }
    })
    
    let partnersUpdated = 0
    for (const partner of partners) {
      const updates: any = {}
      
      if (partner.billingCity?.startsWith('·')) {
        updates.billingCity = partner.billingCity.substring(1).trim()
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.partner.update({
          where: { id: partner.id },
          data: updates
        })
        partnersUpdated++
        console.log(`  ✅ ${partner.companyName}: ${Object.keys(updates).join(', ')} nettoyés`)
      }
    }
    
    console.log(`👥 ${partnersUpdated} partenaires mis à jour`)
    
    console.log('✅ Nettoyage terminé !')
    console.log(`📊 Résumé:`)
    console.log(`  - ${establishmentsUpdated} établissements nettoyés`)
    console.log(`  - ${partnersUpdated} partenaires nettoyés`)
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanAddresses()

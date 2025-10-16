import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findEntityById(entityId: string) {
  try {
    console.log(`🔍 Recherche de l'entité: ${entityId}`)

    // Chercher dans PartnerStorefront
    const storefront = await prisma.partnerStorefront.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        partnerId: true,
        type: true,
        isActive: true,
        partner: {
          select: {
            companyName: true
          }
        }
      }
    })

    if (storefront) {
      console.log(`✅ Trouvé dans PartnerStorefront:`)
      console.log(`   ID: ${storefront.id}`)
      console.log(`   Partner ID: ${storefront.partnerId}`)
      console.log(`   Type: ${storefront.type}`)
      console.log(`   Actif: ${storefront.isActive}`)
      console.log(`   Partenaire: ${storefront.partner?.companyName}`)
      return { type: 'storefront', data: storefront }
    }

    // Chercher dans Partner
    const partner = await prisma.partner.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        companyName: true,
        serviceType: true
      }
    })

    if (partner) {
      console.log(`✅ Trouvé dans Partner:`)
      console.log(`   ID: ${partner.id}`)
      console.log(`   Nom: ${partner.companyName}`)
      console.log(`   Service: ${partner.serviceType}`)
      return { type: 'partner', data: partner }
    }

    // Chercher dans Establishment
    const establishment = await prisma.establishment.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        name: true,
        type: true
      }
    })

    if (establishment) {
      console.log(`✅ Trouvé dans Establishment:`)
      console.log(`   ID: ${establishment.id}`)
      console.log(`   Nom: ${establishment.name}`)
      console.log(`   Type: ${establishment.type}`)
      return { type: 'establishment', data: establishment }
    }

    console.log(`❌ Entité non trouvée dans aucune table`)
    return null

  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

// Utiliser l'ID depuis l'URL
const entityId = '68bfa7178ee56a699c75b0fc'
findEntityById(entityId).catch(console.error)

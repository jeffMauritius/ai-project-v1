import { PrismaClient, ServiceType } from '@prisma/client'

const prisma = new PrismaClient()

async function fixLieuStorefronts() {
  console.log('Recherche des storefronts LIEU sans establishmentId...')

  // Trouver tous les storefronts de type VENUE sans establishmentId
  const storefronts = await prisma.partnerStorefront.findMany({
    where: {
      type: 'VENUE',
      establishmentId: null,
      partnerId: { not: null }
    },
    include: {
      partner: true
    }
  })

  console.log(`Trouvé ${storefronts.length} storefront(s) à corriger`)

  for (const storefront of storefronts) {
    if (!storefront.partner) {
      console.log(`  - Storefront ${storefront.id}: pas de partner associé, ignoré`)
      continue
    }

    console.log(`  - Storefront ${storefront.id} (${storefront.partner.companyName})`)

    // Créer un Establishment pour ce storefront
    const establishment = await prisma.establishment.create({
      data: {
        name: storefront.partner.companyName || 'Lieu de réception',
        description: storefront.partner.description || '',
        address: storefront.partner.billingStreet || '',
        city: storefront.partner.billingCity || '',
        postalCode: storefront.partner.billingPostalCode || '',
        country: storefront.partner.billingCountry || 'France',
        latitude: storefront.partner.latitude || 48.8566,
        longitude: storefront.partner.longitude || 2.3522,
      }
    })

    console.log(`    -> Establishment créé: ${establishment.id}`)

    // Lier l'Establishment au storefront
    await prisma.partnerStorefront.update({
      where: { id: storefront.id },
      data: { establishmentId: establishment.id }
    })

    console.log(`    -> Storefront mis à jour avec establishmentId`)
  }

  console.log('Terminé!')
}

fixLieuStorefronts()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

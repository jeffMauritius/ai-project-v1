import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fix() {
  const storefrontId = '694a1a9a61a6bd40a6620a96'

  // Récupérer le storefront et son partner
  const sf = await prisma.partnerStorefront.findUnique({
    where: { id: storefrontId },
    include: { partner: true }
  })

  if (!sf || !sf.partner) {
    console.log('Storefront ou partner non trouvé')
    return
  }

  console.log('Création de l\'Establishment pour:', sf.partner.companyName)

  // Créer l'Establishment
  const establishment = await prisma.establishment.create({
    data: {
      name: sf.partner.companyName || 'Lieu de réception',
      description: sf.partner.description || '',
      address: sf.partner.billingStreet || '',
      city: sf.partner.billingCity || '',
      postalCode: sf.partner.billingPostalCode || '',
      region: 'Île-de-France',
      country: sf.partner.billingCountry || 'France',
      latitude: sf.partner.latitude || 48.8566,
      longitude: sf.partner.longitude || 2.3522,
      maxCapacity: 100,
      startingPrice: 0,
      venueType: 'DOMAINE',
    }
  })

  console.log('Establishment créé:', establishment.id)

  // Mettre à jour le storefront
  await prisma.partnerStorefront.update({
    where: { id: storefrontId },
    data: { establishmentId: establishment.id }
  })

  console.log('Storefront mis à jour avec establishmentId:', establishment.id)
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

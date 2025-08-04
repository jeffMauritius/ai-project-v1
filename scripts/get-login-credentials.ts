import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getLoginCredentials(companyName: string) {
  try {
    console.log(`🔍 Recherche des identifiants pour: ${companyName}`)

    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        companyName: companyName
      },
      include: {
        user: true
      }
    })

    if (!storefront) {
      console.log(`❌ Aucune vitrine trouvée pour: ${companyName}`)
      return
    }

    console.log(`\n✅ Vitrine trouvée:`)
    console.log(`   📋 Nom: ${storefront.companyName}`)
    console.log(`   📧 Email: ${storefront.user.email}`)
    console.log(`   🔑 Mot de passe: Test123!`)
    console.log(`   🏛️  Type: ${storefront.serviceType}`)
    console.log(`   🗺️  Adresse: ${storefront.venueAddress}`)
    console.log(`   📍 Coordonnées: ${storefront.venueLatitude}, ${storefront.venueLongitude}`)

    console.log(`\n🔗 URL de connexion: http://localhost:3000/auth/login`)
    console.log(`📝 Identifiants de test:`)
    console.log(`   Email: ${storefront.user.email}`)
    console.log(`   Mot de passe: Test123!`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Récupérer les identifiants pour "Château des Bordes"
getLoginCredentials("Château des Bordes") 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createMonaIlsaPartner() {
  try {
    console.log('👩‍🎨 Création du partenaire Mona Ilsa...')

    // 1. Créer l'utilisateur partenaire Mona Ilsa
    console.log('\n1. Création de l\'utilisateur partenaire...')
    const monaIlsa = await prisma.user.upsert({
      where: { email: 'mona-ilsa@example.com' },
      update: {},
      create: {
        email: 'mona-ilsa@example.com',
        name: 'Mona Ilsa',
        password: 'mona-ilsa-password',
        role: 'PARTNER'
      }
    })
    console.log('✅ Utilisateur partenaire créé:', monaIlsa.id)

    // 2. Créer le profil partenaire
    console.log('\n2. Création du profil partenaire...')
    let partnerProfile = await prisma.partner.findFirst({
      where: { userId: monaIlsa.id }
    })

    if (!partnerProfile) {
      partnerProfile = await prisma.partner.create({
        data: {
          companyName: 'Mona Ilsa',
          description: 'Lisa est passionnée par la création de moments inoubliables. Dès son plus jeune âge, elle a été attirée par le dessin, le design et la création. Après des études artistiques, son mariage en 2014 a été une révélation qui l\'a conduite vers la décoration d\'événements. Aujourd\'hui Wedding & Event Designer, elle croit que chaque événement est unique et s\'efforce de personnaliser chaque concept.',
          serviceType: 'DECORATION',
          billingStreet: 'Rue de la Créativité',
          billingCity: 'Liège',
          billingPostalCode: '4000',
          billingCountry: 'France',
          siret: '12345678901234',
          vatNumber: 'FR12345678901',
          interventionType: 'all_france',
          interventionRadius: 50,
          userId: monaIlsa.id
        }
      })
      console.log('✅ Profil partenaire créé:', partnerProfile.id)
    } else {
      console.log('✅ Profil partenaire existant:', partnerProfile.id)
    }

    // 3. Créer le storefront
    console.log('\n3. Création du storefront...')
    let storefront = await prisma.partnerStorefront.findFirst({
      where: { partnerId: partnerProfile.id }
    })

    if (!storefront) {
      storefront = await prisma.partnerStorefront.create({
        data: {
          type: 'PARTNER',
          isActive: true,
          partnerId: partnerProfile.id
        }
      })
      console.log('✅ Storefront créé:', storefront.id)
    } else {
      console.log('✅ Storefront existant:', storefront.id)
    }

    console.log('\n🎉 Partenaire Mona Ilsa créé avec succès !')
    console.log('\n📱 Pour tester:')
    console.log('   1. Allez sur /partner/mona-ilsa')
    console.log('   2. Connectez-vous avec votre compte utilisateur')
    console.log('   3. Envoyez un message via le chat')
    console.log('   4. Le message apparaîtra dans votre dashboard Messages')

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la création
createMonaIlsaPartner() 
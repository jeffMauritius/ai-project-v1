import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixRemainingServiceTypes() {
  console.log('🔧 Correction des types restants (doublons)...')
  console.log('==============================================')

  try {
    // Trouver tous les partenaires avec ces noms problématiques
    const problematicNames = [
      'Loc Story',
      'SL Création', 
      'Brin de Couleur',
      'Clauday Evénements',
      'La Signature',
      'L\'Atelier Nectarine'
    ]

    let totalFixed = 0

    for (const companyName of problematicNames) {
      console.log(`\n🔍 Recherche de tous les partenaires: ${companyName}`)
      
      const partners = await prisma.partner.findMany({
        where: { companyName: companyName },
        select: { id: true, companyName: true, serviceType: true }
      })

      console.log(`   Trouvé ${partners.length} partenaire(s)`)

      for (const partner of partners) {
        console.log(`   ID: ${partner.id}, Type actuel: ${partner.serviceType}`)
        
        // Déterminer le bon type selon le nom
        let correctType = 'ORGANISATION' // par défaut
        
        if (companyName.includes('Loc Story') || companyName.includes('SL Création') || 
            companyName.includes('Brin de Couleur') || companyName.includes('Clauday') ||
            companyName.includes('Atelier Nectarine')) {
          correctType = 'DECORATION'
        } else if (companyName.includes('Signature')) {
          correctType = 'MUSIQUE'
        }

        if (partner.serviceType !== correctType) {
          await prisma.partner.update({
            where: { id: partner.id },
            data: { serviceType: correctType as any }
          })
          console.log(`   ✅ Mis à jour: ${partner.serviceType} → ${correctType}`)
          totalFixed++
        } else {
          console.log(`   ✅ Déjà correct`)
        }
      }
    }

    console.log(`\n🎉 Total corrigé: ${totalFixed} partenaires`)

  } catch (error: any) {
    console.error('💥 Erreur lors des corrections:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixRemainingServiceTypes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

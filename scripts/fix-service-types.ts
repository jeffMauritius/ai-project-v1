import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixServiceTypes() {
  console.log('🔧 Correction des types de service...')
  console.log('=====================================')

  const corrections = [
    { companyName: 'Loc Story', currentType: 'OFFICIANT', correctType: 'DECORATION' },
    { companyName: 'SL Création', currentType: 'FLORISTE', correctType: 'DECORATION' },
    { companyName: 'Brin de Couleur', currentType: 'ORGANISATION', correctType: 'DECORATION' }
    // LPA Location est déjà correct (ORGANISATION)
  ]

  try {
    for (const correction of corrections) {
      console.log(`\n🔍 Correction de ${correction.companyName}...`)
      
      // Trouver le partenaire
      const partner = await prisma.partner.findFirst({
        where: { companyName: correction.companyName },
        select: { id: true, companyName: true, serviceType: true }
      })

      if (!partner) {
        console.log(`   ❌ Partenaire non trouvé: ${correction.companyName}`)
        continue
      }

      console.log(`   Type actuel: ${partner.serviceType}`)
      console.log(`   Type correct: ${correction.correctType}`)

      if (partner.serviceType === correction.correctType) {
        console.log(`   ✅ Déjà correct`)
        continue
      }

      // Mettre à jour le type
      await prisma.partner.update({
        where: { id: partner.id },
        data: { serviceType: correction.correctType as any }
      })

      console.log(`   ✅ Mis à jour: ${partner.serviceType} → ${correction.correctType}`)
    }

    console.log('\n🎉 Corrections terminées !')

  } catch (error: any) {
    console.error('💥 Erreur lors des corrections:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixServiceTypes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

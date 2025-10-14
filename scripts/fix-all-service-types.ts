import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Corrections basées sur l'analyse améliorée
const corrections = [
  { companyName: 'Clauday Evénements', currentType: 'TRAITEUR', correctType: 'DECORATION' },
  { companyName: 'La Signature', currentType: 'VOITURE', correctType: 'MUSIQUE' },
  { companyName: 'L\'Atelier Nectarine', currentType: 'OFFICIANT', correctType: 'DECORATION' },
  { companyName: 'Adeline Déco', currentType: 'ORGANISATION', correctType: 'DECORATION' },
  { companyName: 'MBH', currentType: 'ORGANISATION', correctType: 'DECORATION' },
  { companyName: 'Hoc Dié', currentType: 'ORGANISATION', correctType: 'DECORATION' },
  { companyName: 'Agellos Event', currentType: 'FLORISTE', correctType: 'ORGANISATION' },
  { companyName: 'Loc Story', currentType: 'OFFICIANT', correctType: 'DECORATION' },
  { companyName: 'SL Création', currentType: 'FLORISTE', correctType: 'DECORATION' },
  { companyName: 'Brin de Couleur', currentType: 'ORGANISATION', correctType: 'DECORATION' }
]

async function fixAllServiceTypes() {
  console.log('🔧 Correction automatique de tous les types de service...')
  console.log('==========================================================')

  try {
    let successCount = 0
    let errorCount = 0
    let alreadyCorrectCount = 0

    for (const correction of corrections) {
      console.log(`\n🔍 Correction de ${correction.companyName}...`)
      
      // Trouver le partenaire
      const partner = await prisma.partner.findFirst({
        where: { companyName: correction.companyName },
        select: { id: true, companyName: true, serviceType: true }
      })

      if (!partner) {
        console.log(`   ❌ Partenaire non trouvé: ${correction.companyName}`)
        errorCount++
        continue
      }

      console.log(`   Type actuel: ${partner.serviceType}`)
      console.log(`   Type correct: ${correction.correctType}`)

      if (partner.serviceType === correction.correctType) {
        console.log(`   ✅ Déjà correct`)
        alreadyCorrectCount++
        continue
      }

      // Mettre à jour le type
      await prisma.partner.update({
        where: { id: partner.id },
        data: { serviceType: correction.correctType as any }
      })

      console.log(`   ✅ Mis à jour: ${partner.serviceType} → ${correction.correctType}`)
      successCount++
    }

    console.log('\n📊 RÉSUMÉ DES CORRECTIONS')
    console.log('=========================')
    console.log(`✅ Corrections réussies: ${successCount}`)
    console.log(`⏭️  Déjà corrects: ${alreadyCorrectCount}`)
    console.log(`❌ Erreurs: ${errorCount}`)
    console.log(`📝 Total traités: ${corrections.length}`)

    console.log('\n🎉 Corrections terminées !')

  } catch (error: any) {
    console.error('💥 Erreur lors des corrections:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixAllServiceTypes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

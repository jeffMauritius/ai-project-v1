import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkFormattedDescription() {
  try {
    // Récupérer un établissement pour vérifier
    const establishment = await prisma.establishment.findFirst({
      select: {
        id: true,
        name: true,
        description: true
      }
    })

    if (!establishment) {
      console.log('❌ Aucun établissement trouvé')
      return
    }

    console.log(`📋 Établissement: ${establishment.name}`)
    console.log(`📝 Description (${establishment.description.length} caractères):`)
    console.log('='.repeat(80))
    console.log(establishment.description)
    console.log('='.repeat(80))
    
    // Compter les retours à la ligne
    const lineBreaks = (establishment.description.match(/\n/g) || []).length
    console.log(`\n📊 Statistiques:`)
    console.log(`   - Nombre de retours à la ligne: ${lineBreaks}`)
    console.log(`   - Nombre de points: ${(establishment.description.match(/\./g) || []).length}`)
    
    // Vérifier si la description contient des retours à la ligne doubles
    const hasDoubleLineBreaks = establishment.description.includes('\n\n')
    console.log(`   - Contient des retours à la ligne doubles: ${hasDoubleLineBreaks ? '✅ Oui' : '❌ Non'}`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkFormattedDescription() 
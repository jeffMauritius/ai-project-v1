import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getAllEstablishmentTypes() {
  try {
    console.log('🔍 Récupération de tous les types d\'établissements...')
    
    // Récupérer tous les types distincts
    const types = await prisma.establishment.findMany({
      select: {
        type: true
      },
      distinct: ['type']
    })
    
    console.log('\n📊 TYPES D\'ÉTABLISSEMENTS DISPONIBLES:')
    console.log('='.repeat(50))
    
    // Compter le nombre d'établissements par type
    const typeCounts = await Promise.all(
      types.map(async (item) => {
        const count = await prisma.establishment.count({
          where: { type: item.type }
        })
        return { type: item.type, count }
      })
    )
    
    // Trier par nombre décroissant
    typeCounts.sort((a, b) => b.count - a.count)
    
    for (const { type, count } of typeCounts) {
      console.log(`• ${type}: ${count} établissements`)
    }
    
    console.log('\n📈 TOTAL:', typeCounts.reduce((sum, item) => sum + item.count, 0), 'établissements')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getAllEstablishmentTypes()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function simpleCheck() {
  console.log('🔍 VÉRIFICATION SIMPLE - État de la base de données\n')

  try {
    // 1. Compter les partenaires par serviceType
    console.log('📊 Nombre de partenaires par serviceType:')
    const counts = await prisma.partner.groupBy({
      by: ['serviceType'],
      _count: { serviceType: true },
      orderBy: { _count: { serviceType: 'desc' } }
    })

    counts.forEach(group => {
      console.log(`  ${group.serviceType}: ${group._count.serviceType}`)
    })

    // 2. Vérifier le problème principal
    console.log('\n🚨 PROBLÈME PRINCIPAL:')
    const photographersAsVehicles = await prisma.partner.count({
      where: {
        serviceType: 'VOITURE',
        OR: [
          { companyName: { contains: 'Photo', mode: 'insensitive' } },
          { companyName: { contains: 'Photographe', mode: 'insensitive' } }
        ]
      }
    })

    console.log(`❌ ${photographersAsVehicles} photographes classés comme VOITURE`)

    // 3. Exemple concret
    console.log('\n📋 EXEMPLE CONCRET:')
    const example = await prisma.partner.findFirst({
      where: {
        serviceType: 'VOITURE',
        companyName: { contains: 'Photo', mode: 'insensitive' }
      },
      select: {
        companyName: true,
        serviceType: true,
        description: true
      }
    })

    if (example) {
      console.log(`Nom: ${example.companyName}`)
      console.log(`ServiceType: ${example.serviceType}`)
      console.log(`Description: ${example.description.substring(0, 100)}...`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

simpleCheck()





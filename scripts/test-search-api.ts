import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSearchAPI() {
  try {
    console.log('🔍 Test de l\'API de recherche...')
    
    // Simuler une recherche pour "domaine mariage"
    const query = "domaine mariage"
    console.log(`Recherche: "${query}"`)
    
    // Analyser la requête avec IA (simulation)
    const analysis = {
      serviceType: ['LIEU'],
      location: '',
      features: ['domaine'],
      date: '',
      style: []
    }
    
    console.log('Analyse IA:', analysis)
    
    // Construire la requête Prisma
    const whereClause: any = {}
    
    if (analysis.serviceType.includes('LIEU')) {
      whereClause.type = { contains: 'domaine', mode: 'insensitive' }
    }
    
    console.log('Filtres Prisma:', JSON.stringify(whereClause, null, 2))
    
    // Exécuter la requête
    const establishments = await prisma.establishment.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        region: true,
        storefronts: {
          select: {
            id: true,
            type: true
          },
          take: 1
        }
      },
      take: 10
    })
    
    console.log(`\n📊 ${establishments.length} établissements trouvés`)
    console.log('')
    
    establishments.forEach((establishment, index) => {
      console.log(`${index + 1}. ${establishment.name}`)
      console.log(`   Type: ${establishment.type}`)
      console.log(`   Localisation: ${establishment.city}, ${establishment.region}`)
      console.log(`   Storefront ID: ${establishment.storefronts[0]?.id || establishment.id}`)
      console.log('')
    })
    
    // Vérifier s'il y a des établissements qui ne sont pas des domaines
    const nonDomaines = establishments.filter(est => 
      !est.type.toLowerCase().includes('domaine')
    )
    
    if (nonDomaines.length > 0) {
      console.log('🚨 ÉTABLISSEMENTS QUI NE SONT PAS DES DOMAINES:')
      console.log('==============================================')
      nonDomaines.forEach(est => {
        console.log(`❌ ${est.name} - Type: ${est.type}`)
      })
    } else {
      console.log('✅ Tous les établissements sont des domaines')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSearchAPI()

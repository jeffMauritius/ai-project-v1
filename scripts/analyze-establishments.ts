import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeEstablishments() {
  try {
    console.log('🔍 Analyse des établissements...')
    
    // Récupérer quelques établissements pour analyser
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        region: true,
        storefronts: {
          select: {
            id: true,
            type: true,
            isActive: true
          }
        }
      },
      take: 20
    })
    
    console.log(`📊 ${establishments.length} établissements analysés`)
    console.log('')
    
    let withStorefront = 0
    let withoutStorefront = 0
    let activeStorefronts = 0
    
    console.log('📋 DÉTAIL DES ÉTABLISSEMENTS:')
    console.log('================================')
    
    establishments.forEach((establishment, index) => {
      const hasStorefront = establishment.storefronts.length > 0
      const activeStorefront = establishment.storefronts.find(s => s.isActive)
      
      if (hasStorefront) {
        withStorefront++
        if (activeStorefront) {
          activeStorefronts++
        }
      } else {
        withoutStorefront++
      }
      
      console.log(`${index + 1}. ${establishment.name}`)
      console.log(`   Type: ${establishment.type}`)
      console.log(`   Localisation: ${establishment.city}, ${establishment.region}`)
      console.log(`   Storefronts: ${establishment.storefronts.length}`)
      
      if (hasStorefront) {
        establishment.storefronts.forEach((storefront, i) => {
          console.log(`     ${i + 1}. ID: ${storefront.id}, Type: ${storefront.type}, Actif: ${storefront.isActive}`)
        })
      } else {
        console.log(`     ❌ Aucun storefront`)
      }
      console.log('')
    })
    
    console.log('📊 STATISTIQUES:')
    console.log('================')
    console.log(`Total établissements: ${establishments.length}`)
    console.log(`Avec storefront: ${withStorefront}`)
    console.log(`Sans storefront: ${withoutStorefront}`)
    console.log(`Storefronts actifs: ${activeStorefronts}`)
    console.log('')
    
    // Analyser les types d'établissements
    console.log('🏷️ TYPES D\'ÉTABLISSEMENTS:')
    console.log('============================')
    const typeCounts: Record<string, number> = {}
    establishments.forEach(est => {
      typeCounts[est.type] = (typeCounts[est.type] || 0) + 1
    })
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`${type}: ${count}`)
    })
    
    // Vérifier s'il y a des établissements qui ne sont pas des lieux
    console.log('')
    console.log('🚨 ÉTABLISSEMENTS SUSPECTS (pas des lieux):')
    console.log('============================================')
    
    const nonVenueTypes = establishments.filter(est => 
      !est.type.toLowerCase().includes('mariage') && 
      !est.type.toLowerCase().includes('château') &&
      !est.type.toLowerCase().includes('domaine') &&
      !est.type.toLowerCase().includes('salle') &&
      !est.type.toLowerCase().includes('restaurant') &&
      !est.type.toLowerCase().includes('hôtel') &&
      !est.type.toLowerCase().includes('auberge') &&
      !est.type.toLowerCase().includes('bateau')
    )
    
    if (nonVenueTypes.length > 0) {
      nonVenueTypes.forEach(est => {
        console.log(`❌ ${est.name} - Type: ${est.type}`)
      })
    } else {
      console.log('✅ Tous les établissements semblent être des lieux')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeEstablishments()
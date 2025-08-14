import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log('🔍 Vérification des doublons de vitrines...')

    // Récupérer tous les partenaires avec leurs vitrines
    const partners = await prisma.partner.findMany({
      include: {
        storefronts: {
          include: {
            media: true
          }
        }
      }
    })

    console.log(`📊 Total des partenaires: ${partners.length}`)

    const duplicates = []
    const statistics = {
      totalPartners: partners.length,
      totalStorefronts: 0,
      partnersWithDuplicates: 0
    }

    // Analyser les doublons
    partners.forEach(partner => {
      statistics.totalStorefronts += partner.storefronts.length
      
      if (partner.storefronts.length > 1) {
        statistics.partnersWithDuplicates++
        
        const partnerDuplicates = {
          partnerId: partner.id,
          companyName: partner.companyName,
          serviceType: partner.serviceType,
          storefronts: partner.storefronts.map(storefront => ({
            id: storefront.id,
            type: storefront.type,
            isActive: storefront.isActive,
            createdAt: storefront.createdAt,
            mediaCount: storefront.media.length,
            url: `http://localhost:3000/storefront/${storefront.id}`
          }))
        }
        
        duplicates.push(partnerDuplicates)
        
        console.log(`⚠️  DOUBLONS DÉTECTÉS pour: ${partner.companyName} (${partner.serviceType})`)
        console.log(`   Nombre de vitrines: ${partner.storefronts.length}`)
      }
    })

    // Vérifier les vitrines orphelines
    const orphanStorefronts = await prisma.partnerStorefront.findMany({
      where: {
        partnerId: null
      }
    })

    const result = {
      duplicates,
      orphanStorefronts: orphanStorefronts.map(s => ({
        id: s.id,
        type: s.type,
        createdAt: s.createdAt
      })),
      statistics
    }

    console.log(`📈 Statistiques:`)
    console.log(`   Total des vitrines: ${statistics.totalStorefronts}`)
    console.log(`   Partenaires avec doublons: ${statistics.partnersWithDuplicates}`)
    console.log(`   Vitrines orphelines: ${orphanStorefronts.length}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erreur:', error)
    return new NextResponse(`Erreur lors de l'analyse: ${error}`, { status: 500 })
  }
} 
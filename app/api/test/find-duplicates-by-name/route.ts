import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log('🔍 Recherche des doublons par nom de compagnie...')

    // Récupérer tous les partenaires avec leurs vitrines
    const partners = await prisma.partner.findMany({
      include: {
        storefronts: {
          include: {
            media: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Grouper par nom de compagnie
    const partnersByName = new Map<string, any[]>()
    
    partners.forEach(partner => {
      const companyName = partner.companyName
      if (!partnersByName.has(companyName)) {
        partnersByName.set(companyName, [])
      }
      partnersByName.get(companyName)!.push(partner)
    })

    const duplicates = []

    // Identifier les doublons
    for (const [companyName, partnerGroup] of partnersByName.entries()) {
      if (partnerGroup.length > 1) {
        console.log(`\n⚠️  DOUBLONS DÉTECTÉS pour: ${companyName}`)
        console.log(`   Nombre de partenaires: ${partnerGroup.length}`)
        
        const duplicateInfo = {
          companyName,
          partners: partnerGroup.map(partner => ({
            partnerId: partner.id,
            storefrontId: partner.storefronts[0]?.id || 'Aucune vitrine',
            createdAt: partner.createdAt,
            updatedAt: partner.updatedAt,
            description: partner.description,
            serviceType: partner.serviceType,
            hasMedia: partner.storefronts[0]?.media.length > 0,
            mediaCount: partner.storefronts[0]?.media.length || 0,
            url: `http://localhost:3000/storefront/${partner.storefronts[0]?.id || 'N/A'}`
          }))
        }
        
        duplicates.push(duplicateInfo)
        
        partnerGroup.forEach((partner, index) => {
          console.log(`   Partenaire ${index + 1}:`)
          console.log(`     ID: ${partner.id}`)
          console.log(`     Vitrine: ${partner.storefronts[0]?.id || 'Aucune'}`)
          console.log(`     Créé: ${partner.createdAt}`)
          console.log(`     Médias: ${partner.storefronts[0]?.media.length || 0}`)
          console.log(`     URL: http://localhost:3000/storefront/${partner.storefronts[0]?.id || 'N/A'}`)
        })
      }
    }

    const result = {
      duplicates,
      summary: {
        totalPartners: partners.length,
        totalDuplicates: duplicates.length,
        totalDuplicateGroups: duplicates.length
      }
    }

    console.log(`\n📈 Résumé:`)
    console.log(`   Total des partenaires: ${partners.length}`)
    console.log(`   Groupes avec doublons: ${duplicates.length}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erreur:', error)
    return new NextResponse(`Erreur lors de l'analyse: ${error}`, { status: 500 })
  }
} 
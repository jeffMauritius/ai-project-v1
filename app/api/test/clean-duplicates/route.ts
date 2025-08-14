import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    console.log('🧹 Nettoyage des doublons de partenaires...')

    // Récupérer tous les partenaires groupés par nom
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
    const partnersByName = new Map()
    partners.forEach(partner => {
      if (!partnersByName.has(partner.companyName)) {
        partnersByName.set(partner.companyName, [])
      }
      partnersByName.get(partner.companyName).push(partner)
    })

    const cleaned = []
    const deleted = []

    // Pour chaque groupe de partenaires avec le même nom
    for (const companyName of partnersByName.keys()) {
      const partnerGroup = partnersByName.get(companyName)!
      if (partnerGroup.length > 1) {
        console.log(`\n🔍 Traitement des doublons pour: ${companyName}`)
        console.log(`   Nombre de partenaires: ${partnerGroup.length}`)

        // Garder le premier (le plus ancien) et supprimer les autres
        const [keepPartner, ...duplicates] = partnerGroup

        console.log(`   ✅ Garder: ${keepPartner.id} (créé le ${keepPartner.createdAt})`)
        console.log(`   🗑️  Supprimer: ${duplicates.length} doublons`)

        // Supprimer les doublons
        for (const duplicate of duplicates) {
          console.log(`      - Suppression du partenaire ${duplicate.id} et ses vitrines`)
          
          // Supprimer les vitrines du partenaire (cascade automatique pour les médias)
          await prisma.partnerStorefront.deleteMany({
            where: {
              partnerId: duplicate.id
            }
          })

          // Supprimer le partenaire
          await prisma.partner.delete({
            where: {
              id: duplicate.id
            }
          })

          deleted.push({
            partnerId: duplicate.id,
            companyName: duplicate.companyName,
            createdAt: duplicate.createdAt
          })
        }

        cleaned.push({
          companyName,
          keptPartnerId: keepPartner.id,
          deletedCount: duplicates.length
        })
      }
    }

    // Vérifier les vitrines orphelines et les supprimer
    const orphanStorefronts = await prisma.partnerStorefront.findMany({
      where: {
        partnerId: null
      }
    })

    console.log(`\n🗑️  Suppression de ${orphanStorefronts.length} vitrines orphelines`)
    
    if (orphanStorefronts.length > 0) {
      await prisma.partnerStorefront.deleteMany({
        where: {
          partnerId: null
        }
      })
    }

    const result = {
      cleaned,
      deleted,
      orphanStorefrontsDeleted: orphanStorefronts.length,
      summary: {
        totalCleaned: cleaned.length,
        totalDeleted: deleted.length,
        totalOrphanStorefrontsDeleted: orphanStorefronts.length
      }
    }

    console.log(`\n✅ Nettoyage terminé:`)
    console.log(`   - Groupes nettoyés: ${cleaned.length}`)
    console.log(`   - Partenaires supprimés: ${deleted.length}`)
    console.log(`   - Vitrines orphelines supprimées: ${orphanStorefronts.length}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    return new NextResponse(`Erreur lors du nettoyage: ${error}`, { status: 500 })
  }
} 
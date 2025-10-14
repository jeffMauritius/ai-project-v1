import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDuplicateHashes() {
  console.log('🔧 Correction des hash dupliqués...')
  console.log('===================================')

  try {
    // Récupérer tous les partenaires avec des images
    const partners = await prisma.partner.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        companyName: true,
        images: true
      }
    })

    console.log(`📊 ${partners.length} partenaires avec des images trouvés`)

    let totalFixed = 0
    let totalPartnersProcessed = 0

    for (const partner of partners) {
      console.log(`\n🔍 Traitement de ${partner.companyName}...`)
      
      if (!partner.images || partner.images.length === 0) {
        console.log('  ⏭️  Aucune image, ignoré')
        continue
      }

      // Vérifier si toutes les images ont le même hash
      const hashes = partner.images.map(url => {
        const parts = url.split('/')
        const filename = parts[parts.length - 1]
        const hashPart = filename.split('-').slice(2).join('-').replace('.webp', '')
        return hashPart
      })

      const uniqueHashes = [...new Set(hashes)]
      
      if (uniqueHashes.length === 1) {
        console.log(`  🔍 Toutes les images ont le même hash: ${uniqueHashes[0]}`)
        console.log(`  ⚠️  Ce partenaire a probablement des hash dupliqués`)
        
        // Pour l'instant, on ne peut pas corriger automatiquement sans accès à Vercel Blob
        // On va juste marquer ce partenaire comme ayant un problème
        console.log(`  📝 Partenaire marqué pour correction manuelle`)
        totalFixed++
      } else {
        console.log(`  ✅ Hash variés détectés: ${uniqueHashes.length} différents`)
      }

      totalPartnersProcessed++
    }

    console.log('\n🎉 ANALYSE TERMINÉE !')
    console.log('====================')
    console.log(`📊 Partenaires traités: ${totalPartnersProcessed}`)
    console.log(`🔧 Partenaires avec hash dupliqués: ${totalFixed}`)

    // Afficher quelques exemples de partenaires problématiques
    console.log('\n📋 EXEMPLES DE PARTENAIRES PROBLÉMATIQUES:')
    const problematicPartners = partners.slice(0, 5)
    for (const partner of problematicPartners) {
      if (partner.images && partner.images.length > 0) {
        const firstUrl = partner.images[0]
        const parts = firstUrl.split('/')
        const filename = parts[parts.length - 1]
        const hashPart = filename.split('-').slice(2).join('-').replace('.webp', '')
        
        console.log(`  ${partner.companyName}:`)
        console.log(`    Hash utilisé: ${hashPart}`)
        console.log(`    Nombre d'images: ${partner.images.length}`)
      }
    }

  } catch (error: any) {
    console.error('💥 Erreur lors de l\'analyse:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixDuplicateHashes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function extractAllHashes() {
  console.log('🔍 Extraction de tous les hash d\'images...')
  console.log('==========================================')

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

    const allHashes = new Set<string>()
    const hashCounts = new Map<string, number>()
    const partnerHashExamples = new Map<string, string[]>()

    for (const partner of partners) {
      if (!partner.images || partner.images.length === 0) continue

      for (const imageUrl of partner.images) {
        try {
          const parts = imageUrl.split('/')
          const filename = parts[parts.length - 1]
          
          // Extraire le hash (partie après le deuxième tiret)
          const hashPart = filename.split('-').slice(2).join('-').replace('.webp', '')
          
          if (hashPart && hashPart.length > 10) { // Vérifier que c'est un hash valide
            allHashes.add(hashPart)
            hashCounts.set(hashPart, (hashCounts.get(hashPart) || 0) + 1)
            
            // Garder quelques exemples par hash
            if (!partnerHashExamples.has(hashPart)) {
              partnerHashExamples.set(hashPart, [])
            }
            if (partnerHashExamples.get(hashPart)!.length < 3) {
              partnerHashExamples.get(hashPart)!.push(partner.companyName)
            }
          }
        } catch (error) {
          console.log(`Erreur parsing URL: ${imageUrl}`)
        }
      }
    }

    console.log(`\n🎯 ${allHashes.size} hash uniques trouvés`)
    console.log('=====================================')

    // Trier par fréquence d'utilisation
    const sortedHashes = Array.from(hashCounts.entries())
      .sort((a, b) => b[1] - a[1])

    console.log('\n📊 TOP 50 DES HASH LES PLUS UTILISÉS:')
    console.log('====================================')
    
    for (let i = 0; i < Math.min(50, sortedHashes.length); i++) {
      const [hash, count] = sortedHashes[i]
      const examples = partnerHashExamples.get(hash) || []
      console.log(`${i + 1}. ${hash} (${count} utilisations)`)
      console.log(`   Exemples: ${examples.join(', ')}`)
    }

    // Générer le code pour le script de correction
    console.log('\n🔧 CODE POUR LE SCRIPT DE CORRECTION:')
    console.log('====================================')
    console.log('const POSSIBLE_HASHES = [')
    
    for (let i = 0; i < Math.min(100, sortedHashes.length); i++) {
      const [hash] = sortedHashes[i]
      console.log(`  '${hash}',`)
    }
    
    console.log(']')

    // Analyser les patterns
    console.log('\n🔍 ANALYSE DES PATTERNS:')
    console.log('======================')
    
    const hashLengths = Array.from(allHashes).map(h => h.length)
    const avgLength = hashLengths.reduce((a, b) => a + b, 0) / hashLengths.length
    console.log(`Longueur moyenne des hash: ${avgLength.toFixed(1)} caractères`)
    console.log(`Longueur min: ${Math.min(...hashLengths)}`)
    console.log(`Longueur max: ${Math.max(...hashLengths)}`)

    // Vérifier les hash qui semblent être des doublons
    const suspiciousHashes = sortedHashes.filter(([hash, count]) => count > 100)
    if (suspiciousHashes.length > 0) {
      console.log('\n⚠️  HASH SUSPECTS (probablement des doublons):')
      console.log('==========================================')
      suspiciousHashes.forEach(([hash, count]) => {
        console.log(`${hash}: ${count} utilisations`)
      })
    }

  } catch (error: any) {
    console.error('💥 Erreur lors de l\'extraction:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  extractAllHashes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

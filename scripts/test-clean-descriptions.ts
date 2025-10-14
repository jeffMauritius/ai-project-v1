import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fonction pour nettoyer le HTML et réduire les espaces entre les lignes
function cleanHtmlDescription(html: string): string {
  if (!html) return html

  return html
    // Supprimer les balises <br> multiples consécutives
    .replace(/(<br\s*\/?>){2,}/gi, '<br>')
    
    // Supprimer les espaces multiples entre les balises
    .replace(/>\s+</g, '><')
    
    // Supprimer les espaces en début et fin de ligne
    .replace(/\s+$/gm, '')
    .replace(/^\s+/gm, '')
    
    // Remplacer les paragraphes vides par des sauts de ligne simples
    .replace(/<p>\s*<\/p>/gi, '<br>')
    
    // Supprimer les sauts de ligne multiples
    .replace(/(<br\s*\/?>){3,}/gi, '<br><br>')
    
    // Nettoyer les espaces autour des balises
    .replace(/\s*<br\s*\/?>\s*/gi, '<br>')
    
    // Supprimer les espaces en début et fin
    .trim()
}

async function testCleanDescriptions() {
  console.log('🧹 Test de nettoyage des descriptions HTML...')
  console.log('============================================')

  try {
    // Récupérer les 5 premiers prestataires
    const partners = await prisma.partner.findMany({
      take: 5,
      select: {
        id: true,
        companyName: true,
        description: true
      }
    })

    console.log(`📊 ${partners.length} prestataires à traiter`)

    for (const partner of partners) {
      console.log(`\n🔍 Traitement de ${partner.companyName}...`)
      
      if (!partner.description) {
        console.log('  ⏭️  Aucune description, ignoré')
        continue
      }

      const originalDescription = partner.description
      const cleanedDescription = cleanHtmlDescription(originalDescription)

      // Afficher les différences
      console.log('  📝 Description originale:')
      console.log(`     Longueur: ${originalDescription.length} caractères`)
      console.log(`     Lignes: ${originalDescription.split('\n').length}`)
      
      console.log('  ✨ Description nettoyée:')
      console.log(`     Longueur: ${cleanedDescription.length} caractères`)
      console.log(`     Lignes: ${cleanedDescription.split('\n').length}`)

      // Compter les <br> dans les deux versions
      const originalBrCount = (originalDescription.match(/<br\s*\/?>/gi) || []).length
      const cleanedBrCount = (cleanedDescription.match(/<br\s*\/?>/gi) || []).length
      
      console.log(`     Balises <br> originales: ${originalBrCount}`)
      console.log(`     Balises <br> nettoyées: ${cleanedBrCount}`)

      if (originalDescription !== cleanedDescription) {
        console.log('  🔧 Description modifiée - mise à jour en base')
        
        // Mettre à jour en base de données
        await prisma.partner.update({
          where: { id: partner.id },
          data: { description: cleanedDescription }
        })
        
        console.log('  ✅ Mise à jour effectuée')
      } else {
        console.log('  ✅ Aucune modification nécessaire')
      }

      // Afficher un aperçu de la description nettoyée
      console.log('  📋 Aperçu de la description nettoyée:')
      const preview = cleanedDescription.substring(0, 200) + (cleanedDescription.length > 200 ? '...' : '')
      console.log(`     ${preview}`)
    }

    console.log('\n🎉 Test de nettoyage terminé !')
    console.log('=============================')

  } catch (error: any) {
    console.error('💥 Erreur lors du nettoyage:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testCleanDescriptions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

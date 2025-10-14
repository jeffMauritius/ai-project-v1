import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fonction pour nettoyer le HTML et supprimer les classes CSS problématiques
function cleanHtmlDescription(html: string): string {
  if (!html) return html

  return html
    // Supprimer les classes CSS problématiques des balises <p>
    .replace(/<p class="[^"]*mb-4[^"]*">/gi, '<p>')
    .replace(/<p class="[^"]*leading-relaxed[^"]*">/gi, '<p>')
    .replace(/<p class="[^"]*mb-4 leading-relaxed[^"]*">/gi, '<p>')
    
    // Supprimer les balises <p> vides ou avec seulement des espaces
    .replace(/<p>\s*<\/p>/gi, '')
    
    // Remplacer les balises <p> par des <br> pour réduire l'espacement
    .replace(/<p>/gi, '<br>')
    .replace(/<\/p>/gi, '')
    
    // Supprimer les <br> multiples consécutifs
    .replace(/(<br\s*\/?>){2,}/gi, '<br>')
    
    // Supprimer les espaces en début et fin
    .trim()
    
    // Supprimer le premier <br> s'il existe
    .replace(/^<br\s*\/?>/i, '')
}

async function testCleanDescriptionsAdvanced() {
  console.log('🧹 Test de nettoyage avancé des descriptions HTML...')
  console.log('==================================================')

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
      console.log(`     Balises <p>: ${(originalDescription.match(/<p[^>]*>/gi) || []).length}`)
      console.log(`     Classes mb-4: ${(originalDescription.match(/mb-4/gi) || []).length}`)
      
      console.log('  ✨ Description nettoyée:')
      console.log(`     Longueur: ${cleanedDescription.length} caractères`)
      console.log(`     Balises <br>: ${(cleanedDescription.match(/<br\s*\/?>/gi) || []).length}`)

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
      const preview = cleanedDescription.substring(0, 300) + (cleanedDescription.length > 300 ? '...' : '')
      console.log(`     ${preview}`)
    }

    console.log('\n🎉 Test de nettoyage avancé terminé !')
    console.log('====================================')

  } catch (error: any) {
    console.error('💥 Erreur lors du nettoyage:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testCleanDescriptionsAdvanced()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

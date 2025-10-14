import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fonction pour créer une mise en page moderne et professionnelle
function createModernDescription(html: string): string {
  if (!html) return html

  // Nettoyer d'abord le HTML existant
  let cleaned = html
    .replace(/<p class="[^"]*mb-4[^"]*">/gi, '<p>')
    .replace(/<p class="[^"]*leading-relaxed[^"]*">/gi, '<p>')
    .replace(/<p class="[^"]*mb-4 leading-relaxed[^"]*">/gi, '<p>')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '')
    .replace(/(<br\s*\/?>){2,}/gi, '<br>')
    .trim()
    .replace(/^<br\s*\/?>/i, '')

  // Extraire le texte brut sans les balises HTML
  const textContent = cleaned
    .replace(/<[^>]*>/g, '') // Supprimer toutes les balises HTML
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim()

  // Diviser le texte en phrases
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  if (sentences.length === 0) return html

  // Créer une structure moderne et professionnelle
  let modernHtml = ''

  // Premier paragraphe - Introduction accrocheuse
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim()
    modernHtml += `<div class="text-lg font-medium text-gray-800 mb-4 leading-relaxed">${firstSentence}.</div>`
  }

  // Paragraphes de contenu principal
  if (sentences.length > 1) {
    const middleSentences = sentences.slice(1, -1)
    if (middleSentences.length > 0) {
      const groupedSentences = groupSentences(middleSentences, 2) // Grouper par 2 phrases
      
      groupedSentences.forEach(group => {
        const paragraphText = group.join('. ').trim() + '.'
        modernHtml += `<div class="text-gray-700 mb-3 leading-relaxed">${paragraphText}</div>`
      })
    }
  }

  // Dernier paragraphe - Call to action ou conclusion
  if (sentences.length > 1) {
    const lastSentence = sentences[sentences.length - 1].trim()
    modernHtml += `<div class="text-gray-600 italic mt-4">${lastSentence}.</div>`
  }

  // Ajouter des éléments visuels modernes
  modernHtml = `
    <div class="space-y-4">
      ${modernHtml}
      <div class="border-t border-gray-200 pt-4 mt-6">
        <div class="flex items-center text-sm text-gray-500">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          Professionnel certifié
        </div>
      </div>
    </div>
  `

  return modernHtml
}

// Fonction pour grouper les phrases par chunks
function groupSentences(sentences: string[], chunkSize: number): string[][] {
  const chunks: string[][] = []
  for (let i = 0; i < sentences.length; i += chunkSize) {
    chunks.push(sentences.slice(i, i + chunkSize))
  }
  return chunks
}

async function modernizeDescriptions() {
  console.log('🎨 Modernisation des descriptions des prestataires...')
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

    console.log(`📊 ${partners.length} prestataires à moderniser`)

    for (const partner of partners) {
      console.log(`\n🔍 Modernisation de ${partner.companyName}...`)
      
      if (!partner.description) {
        console.log('  ⏭️  Aucune description, ignoré')
        continue
      }

      const originalDescription = partner.description
      const modernDescription = createModernDescription(originalDescription)

      // Afficher les différences
      console.log('  📝 Description originale:')
      console.log(`     Longueur: ${originalDescription.length} caractères`)
      console.log(`     Balises <p>: ${(originalDescription.match(/<p[^>]*>/gi) || []).length}`)
      
      console.log('  ✨ Description modernisée:')
      console.log(`     Longueur: ${modernDescription.length} caractères`)
      console.log(`     Structure: Introduction + ${(modernDescription.match(/<div class="text-gray-700/g) || []).length} paragraphes + Conclusion`)

      if (originalDescription !== modernDescription) {
        console.log('  🔧 Description modernisée - mise à jour en base')
        
        // Mettre à jour en base de données
        await prisma.partner.update({
          where: { id: partner.id },
          data: { description: modernDescription }
        })
        
        console.log('  ✅ Mise à jour effectuée')
      } else {
        console.log('  ✅ Aucune modification nécessaire')
      }

      // Afficher un aperçu de la description modernisée
      console.log('  📋 Aperçu de la description modernisée:')
      const preview = modernDescription.substring(0, 400) + (modernDescription.length > 400 ? '...' : '')
      console.log(`     ${preview}`)
    }

    console.log('\n🎉 Modernisation terminée !')
    console.log('============================')

  } catch (error: any) {
    console.error('💥 Erreur lors de la modernisation:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  modernizeDescriptions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

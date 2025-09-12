import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fonction pour formater une description
function formatDescription(description: string): string {
  if (!description || description.trim() === '') {
    return ''
  }

  // Nettoyer le texte
  let formatted = description.trim()
  
  // Remplacer les points par des points + saut de ligne pour les phrases longues
  formatted = formatted.replace(/\.\s+/g, '.\n\n')
  
  // Remplacer les virgules par des virgules + saut de ligne pour les listes
  formatted = formatted.replace(/,\s+/g, ',\n')
  
  // Ajouter des sauts de ligne après les deux-points
  formatted = formatted.replace(/:\s+/g, ':\n\n')
  
  // Ajouter des sauts de ligne après les tirets
  formatted = formatted.replace(/-\s+/g, '-\n')
  
  // Diviser en paragraphes basés sur la longueur
  const sentences = formatted.split(/\.\n\n/)
  const paragraphs: string[] = []
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim()
    if (sentence) {
      // Si la phrase est très longue, la diviser
      if (sentence.length > 200) {
        const parts = sentence.split(/,\s+/)
        let currentParagraph = ''
        
        for (const part of parts) {
          if (currentParagraph.length + part.length > 150) {
            if (currentParagraph) {
              paragraphs.push(currentParagraph.trim() + '.')
              currentParagraph = part
            } else {
              paragraphs.push(part.trim() + '.')
            }
          } else {
            currentParagraph += (currentParagraph ? ', ' : '') + part
          }
        }
        
        if (currentParagraph) {
          paragraphs.push(currentParagraph.trim() + '.')
        }
      } else {
        paragraphs.push(sentence + (sentence.endsWith('.') ? '' : '.'))
      }
    }
  }
  
  // Joindre les paragraphes avec des sauts de ligne doubles
  return paragraphs.join('\n\n')
}

// Fonction pour ajouter des balises HTML pour la mise en forme
function addHtmlFormatting(text: string): string {
  if (!text || text.trim() === '') {
    return ''
  }

  // Diviser en paragraphes
  const paragraphs = text.split('\n\n').filter(p => p.trim())
  
  // Formater chaque paragraphe
  const formattedParagraphs = paragraphs.map(paragraph => {
    let formatted = paragraph.trim()
    
    // Mettre en évidence les mots-clés importants
    const keywords = [
      'mariage', 'réception', 'événement', 'cérémonie', 'fête',
      'gastronomie', 'cuisine', 'menu', 'traiteur', 'chef',
      'décoration', 'fleurs', 'bouquet', 'centrepiece',
      'photographe', 'vidéo', 'souvenir', 'mémoire',
      'musique', 'dj', 'orchestre', 'animation',
      'voiture', 'transport', 'limousine', 'bus',
      'lieu', 'château', 'domaine', 'salle', 'terrasse',
      'jardin', 'piscine', 'vue', 'panorama'
    ]
    
    // Encadrer les mots-clés importants
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      formatted = formatted.replace(regex, `<strong>${keyword}</strong>`)
    })
    
    // Mettre en évidence les prix et capacités
    formatted = formatted.replace(/(\d+)\s*(€|euros?|personnes?|invités?)/gi, '<span class="text-pink-600 font-semibold">$1 $2</span>')
    
    // Mettre en évidence les caractéristiques spéciales
    formatted = formatted.replace(/(clé en main|sur mesure|personnalisé|unique|exclusif|premium|luxe)/gi, '<em class="text-blue-600">$1</em>')
    
    return `<p class="mb-4 leading-relaxed">${formatted}</p>`
  })
  
  return formattedParagraphs.join('\n')
}

async function formatEstablishmentDescriptions() {
  try {
    console.log('🎨 Formatage des descriptions des établissements...\n')
    
    // Récupérer tous les établissements
    console.log('📋 Récupération des établissements...')
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    })
    
    console.log(`📊 Total d'établissements trouvés: ${establishments.length}`)
    
    // Compter ceux avec description
    const withDescription = establishments.filter(e => e.description && e.description.trim())
    console.log(`📊 Établissements avec description: ${withDescription.length}`)
    
    if (withDescription.length === 0) {
      console.log('ℹ️ Aucun établissement avec description trouvé')
      return
    }
    
    let updatedEstablishments = 0
    let errorCount = 0
    
    console.log('\n🔄 Début du formatage...')
    
    for (let i = 0; i < withDescription.length; i++) {
      const establishment = withDescription[i]
      
      try {
        console.log(`\n[${i + 1}/${withDescription.length}] Traitement: ${establishment.name}`)
        
        const formatted = formatDescription(establishment.description)
        const htmlFormatted = addHtmlFormatting(formatted)
        
        await prisma.establishment.update({
          where: { id: establishment.id },
          data: { description: htmlFormatted }
        })
        
        updatedEstablishments++
        console.log(`✅ ${establishment.name}: Description formatée`)
        
        // Pause toutes les 10 mises à jour pour éviter la surcharge
        if ((i + 1) % 10 === 0) {
          console.log(`⏳ Pause de 1 seconde... (${i + 1}/${withDescription.length})`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        errorCount++
        console.error(`❌ Erreur pour ${establishment.name}:`, error.message)
      }
    }
    
    console.log(`\n🎉 Formatage terminé !`)
    console.log(`📊 Établissements traités: ${withDescription.length}`)
    console.log(`📊 Établissements mis à jour: ${updatedEstablishments}`)
    console.log(`📊 Erreurs: ${errorCount}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du formatage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

formatEstablishmentDescriptions()

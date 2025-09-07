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

async function formatAllDescriptions() {
  try {
    console.log('🎨 Formatage des descriptions...\n')
    
    // Formater les descriptions des établissements
    console.log('📋 Formatage des établissements...')
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    })
    
    let updatedEstablishments = 0
    for (const establishment of establishments) {
      if (establishment.description && establishment.description.trim()) {
        const formatted = formatDescription(establishment.description)
        const htmlFormatted = addHtmlFormatting(formatted)
        
        await prisma.establishment.update({
          where: { id: establishment.id },
          data: { description: htmlFormatted }
        })
        
        updatedEstablishments++
        console.log(`✅ ${establishment.name}: Description formatée`)
      }
    }
    
    // Formater les descriptions des partenaires
    console.log('\n📋 Formatage des partenaires...')
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        description: true
      }
    })
    
    let updatedPartners = 0
    for (const partner of partners) {
      if (partner.description && partner.description.trim()) {
        const formatted = formatDescription(partner.description)
        const htmlFormatted = addHtmlFormatting(formatted)
        
        await prisma.partner.update({
          where: { id: partner.id },
          data: { description: htmlFormatted }
        })
        
        updatedPartners++
        console.log(`✅ ${partner.companyName}: Description formatée`)
      }
    }
    
    console.log(`\n🎉 Formatage terminé !`)
    console.log(`📊 Établissements mis à jour: ${updatedEstablishments}`)
    console.log(`📊 Partenaires mis à jour: ${updatedPartners}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du formatage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

formatAllDescriptions()

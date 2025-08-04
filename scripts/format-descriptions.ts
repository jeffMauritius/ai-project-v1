import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Fonction pour formater une description en ajoutant des retours à la ligne après chaque phrase
 * @param description - La description originale
 * @returns La description formatée avec des retours à la ligne
 */
function formatDescription(description: string): string {
  if (!description || description.trim() === '') {
    return description
  }

  // Diviser le texte en phrases en utilisant le point comme séparateur
  // On garde le point à la fin de chaque phrase
  const sentences = description.split(/(?<=\.)\s+/)
  
  // Joindre les phrases avec des retours à la ligne
  return sentences.join('\n\n')
}

/**
 * Fonction pour traiter toutes les descriptions des PartnerStorefront
 */
async function formatPartnerStorefrontDescriptions() {
  console.log('🔄 Traitement des descriptions des vitrines partenaires...')
  
  try {
    // Récupérer toutes les vitrines partenaires
    const storefronts = await prisma.partnerStorefront.findMany({
      select: {
        id: true,
        companyName: true,
        description: true
      }
    })

    console.log(`📊 Trouvé ${storefronts.length} vitrines partenaires`)

    let updatedCount = 0
    let skippedCount = 0

    for (const storefront of storefronts) {
      if (!storefront.description || storefront.description.trim() === '') {
        console.log(`⏭️  Vitrine "${storefront.companyName}" - Description vide, ignorée`)
        skippedCount++
        continue
      }

      const formattedDescription = formatDescription(storefront.description)
      
      // Vérifier si la description a changé
      if (formattedDescription !== storefront.description) {
        await prisma.partnerStorefront.update({
          where: { id: storefront.id },
          data: { description: formattedDescription }
        })
        
        console.log(`✅ Vitrine "${storefront.companyName}" - Description formatée`)
        updatedCount++
      } else {
        console.log(`ℹ️  Vitrine "${storefront.companyName}" - Description déjà formatée`)
        skippedCount++
      }
    }

    console.log(`\n📈 Résumé des vitrines partenaires:`)
    console.log(`   - Mises à jour: ${updatedCount}`)
    console.log(`   - Ignorées: ${skippedCount}`)
    console.log(`   - Total: ${storefronts.length}`)

  } catch (error) {
    console.error('❌ Erreur lors du traitement des vitrines partenaires:', error)
  }
}

/**
 * Fonction pour traiter toutes les descriptions des Establishments
 */
async function formatEstablishmentDescriptions() {
  console.log('\n🔄 Traitement des descriptions des établissements...')
  
  try {
    // Récupérer tous les établissements
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    })

    console.log(`📊 Trouvé ${establishments.length} établissements`)

    let updatedCount = 0
    let skippedCount = 0

    for (const establishment of establishments) {
      if (!establishment.description || establishment.description.trim() === '') {
        console.log(`⏭️  Établissement "${establishment.name}" - Description vide, ignorée`)
        skippedCount++
        continue
      }

      const formattedDescription = formatDescription(establishment.description)
      
      // Vérifier si la description a changé
      if (formattedDescription !== establishment.description) {
        await prisma.establishment.update({
          where: { id: establishment.id },
          data: { description: formattedDescription }
        })
        
        console.log(`✅ Établissement "${establishment.name}" - Description formatée`)
        updatedCount++
      } else {
        console.log(`ℹ️  Établissement "${establishment.name}" - Description déjà formatée`)
        skippedCount++
      }
    }

    console.log(`\n📈 Résumé des établissements:`)
    console.log(`   - Mises à jour: ${updatedCount}`)
    console.log(`   - Ignorées: ${skippedCount}`)
    console.log(`   - Total: ${establishments.length}`)

  } catch (error) {
    console.error('❌ Erreur lors du traitement des établissements:', error)
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Début du formatage des descriptions...\n')
  
  try {
    // Traiter les vitrines partenaires
    await formatPartnerStorefrontDescriptions()
    
    // Traiter les établissements
    await formatEstablishmentDescriptions()
    
    console.log('\n🎉 Formatage terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
if (require.main === module) {
  main()
    .catch((error) => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

export { formatDescription, formatPartnerStorefrontDescriptions, formatEstablishmentDescriptions } 
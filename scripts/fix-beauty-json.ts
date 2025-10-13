import fs from 'fs'
import path from 'path'

interface Vendor {
  url: string
  name: string
  type: string
  description: string
  images: string[]
  price: string
  address: string
  city: string
  region: string
  rating: string
  services: string[]
}

// Mapping des segments d'URL vers les types corrects
const URL_TO_TYPE: Record<string, string> = {
  'decoration-mariage': 'decoration',
  'photographe-mariage': 'photographer',
  'videaste-mariage': 'videographer',
  'traiteur-mariage': 'caterer',
  'musique-mariage': 'music',
  'fleuriste-mariage': 'florist',
  'transport-mariage': 'transport',
  'gateau-mariage': 'wedding-cake',
  'invitation-mariage': 'invitation',
  'organisation-mariage': 'organization',
  'animation-mariage': 'entertainment',
  'officiant-mariage': 'officiant',
  'cadeaux-invites': 'gifts',
  'honeymoon': 'honeymoon',
  'beauty-mariage': 'beauty',
  'robe-mariage': 'dress',
  'costume-mariage': 'suit',
  'bijoux-mariage': 'jewelry',
  'vin-mariage': 'wine'
}

function extractTypeFromUrl(url: string): string | null {
  if (!url) return null
  
  try {
    const urlObj = new URL(url)
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0)
    
    // Chercher le segment qui correspond à un type
    for (const segment of pathSegments) {
      if (URL_TO_TYPE[segment]) {
        return URL_TO_TYPE[segment]
      }
    }
    
    return null
  } catch (error) {
    console.warn(`URL invalide: ${url}`)
    return null
  }
}

function fixBeautyJson() {
  console.log('🔧 CORRECTION DU FICHIER BEAUTY.JSON\n')
  
  const filePath = path.join(__dirname, '..', 'data', 'beauty.json')
  
  if (!fs.existsSync(filePath)) {
    throw new Error('Fichier beauty.json non trouvé')
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(fileContent)
  const vendors: Vendor[] = data.vendors || data
  
  console.log(`📊 ${vendors.length} vendors trouvés dans beauty.json`)
  
  let correctedCount = 0
  let unchangedCount = 0
  const typeChanges: Record<string, number> = {}
  
  // Corriger chaque vendor
  for (const vendor of vendors) {
    const correctType = extractTypeFromUrl(vendor.url)
    
    if (correctType && vendor.type !== correctType) {
      const oldType = vendor.type
      vendor.type = correctType
      correctedCount++
      
      // Compter les changements par type
      const changeKey = `${oldType} → ${correctType}`
      typeChanges[changeKey] = (typeChanges[changeKey] || 0) + 1
    } else {
      unchangedCount++
    }
  }
  
  console.log('\n📊 RÉSULTATS DE LA CORRECTION:')
  console.log(`✅ Vendors corrigés: ${correctedCount}`)
  console.log(`⏭️ Vendors inchangés: ${unchangedCount}`)
  
  console.log('\n🔄 CHANGEMENTS EFFECTUÉS:')
  Object.entries(typeChanges)
    .sort(([,a], [,b]) => b - a)
    .forEach(([change, count]) => {
      console.log(`  ${change}: ${count}`)
    })
  
  // Sauvegarder le fichier corrigé
  const correctedData = { vendors }
  const outputPath = path.join(__dirname, '..', 'data', 'beauty-corrected.json')
  
  fs.writeFileSync(outputPath, JSON.stringify(correctedData, null, 2), 'utf-8')
  
  console.log(`\n💾 Fichier corrigé sauvegardé: beauty-corrected.json`)
  console.log(`📁 Chemin: ${outputPath}`)
  
  // Proposer de remplacer l'original
  console.log('\n🎯 ÉTAPES SUIVANTES:')
  console.log('1. Vérifier le fichier beauty-corrected.json')
  console.log('2. Si correct, remplacer beauty.json par beauty-corrected.json')
  console.log('3. Renommer beauty.json en decoration.json (car 99% sont des décorateurs)')
  
  return {
    correctedCount,
    unchangedCount,
    typeChanges,
    outputPath
  }
}

// Exécution
if (require.main === module) {
  try {
    const result = fixBeautyJson()
    
    console.log('\n✅ CORRECTION TERMINÉE !')
    console.log(`📊 ${result.correctedCount} vendors corrigés sur ${result.correctedCount + result.unchangedCount}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  }
}

export { fixBeautyJson }

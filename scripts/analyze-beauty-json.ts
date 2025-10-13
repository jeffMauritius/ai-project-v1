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

interface AnalysisResult {
  totalVendors: number
  correctTypes: number
  incorrectTypes: number
  typeMappings: Record<string, number>
  urlSegments: Record<string, number>
  errors: Array<{
    name: string
    currentType: string
    urlSegment: string
    suggestedType: string
    url: string
  }>
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

function analyzeBeautyJson(): AnalysisResult {
  console.log('🔍 ANALYSE DU FICHIER BEAUTY.JSON\n')
  
  const filePath = path.join(__dirname, '..', 'data', 'beauty.json')
  
  if (!fs.existsSync(filePath)) {
    throw new Error('Fichier beauty.json non trouvé')
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(fileContent)
  const vendors: Vendor[] = data.vendors || data
  
  console.log(`📊 ${vendors.length} vendors trouvés dans beauty.json`)
  
  const result: AnalysisResult = {
    totalVendors: vendors.length,
    correctTypes: 0,
    incorrectTypes: 0,
    typeMappings: {},
    urlSegments: {},
    errors: []
  }
  
  // Analyser chaque vendor
  for (const vendor of vendors) {
    const urlSegment = extractTypeFromUrl(vendor.url)
    
    if (urlSegment) {
      // Compter les segments d'URL
      result.urlSegments[urlSegment] = (result.urlSegments[urlSegment] || 0) + 1
      
      // Vérifier si le type est correct
      if (vendor.type === urlSegment) {
        result.correctTypes++
      } else {
        result.incorrectTypes++
        result.errors.push({
          name: vendor.name,
          currentType: vendor.type,
          urlSegment: urlSegment,
          suggestedType: urlSegment,
          url: vendor.url
        })
      }
    }
    
    // Compter les types actuels
    result.typeMappings[vendor.type] = (result.typeMappings[vendor.type] || 0) + 1
  }
  
  return result
}

function printAnalysis(result: AnalysisResult) {
  console.log('\n📊 RÉSULTATS DE L\'ANALYSE:')
  console.log(`📈 Total vendors: ${result.totalVendors}`)
  console.log(`✅ Types corrects: ${result.correctTypes}`)
  console.log(`❌ Types incorrects: ${result.incorrectTypes}`)
  console.log(`📊 Taux d'erreur: ${((result.incorrectTypes / result.totalVendors) * 100).toFixed(2)}%`)
  
  console.log('\n🏷️ TYPES ACTUELS DANS LE FICHIER:')
  Object.entries(result.typeMappings)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
  
  console.log('\n🔗 SEGMENTS D\'URL DÉTECTÉS:')
  Object.entries(result.urlSegments)
    .sort(([,a], [,b]) => b - a)
    .forEach(([segment, count]) => {
      console.log(`  ${segment}: ${count}`)
    })
  
  console.log('\n❌ ERREURS DÉTECTÉES (premiers 20):')
  result.errors.slice(0, 20).forEach((error, index) => {
    console.log(`  ${index + 1}. ${error.name}`)
    console.log(`     Type actuel: ${error.currentType}`)
    console.log(`     Type suggéré: ${error.suggestedType}`)
    console.log(`     URL: ${error.url}`)
    console.log('')
  })
  
  if (result.errors.length > 20) {
    console.log(`  ... et ${result.errors.length - 20} autres erreurs`)
  }
}

// Exécution
if (require.main === module) {
  try {
    const result = analyzeBeautyJson()
    printAnalysis(result)
    
    console.log('\n🎯 RECOMMANDATIONS:')
    console.log('1. Renommer le fichier beauty.json en decoration.json')
    console.log('2. Corriger tous les types "beauty" en "decoration"')
    console.log('3. Vérifier les autres fichiers JSON pour des erreurs similaires')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
  }
}

export { analyzeBeautyJson, printAnalysis }



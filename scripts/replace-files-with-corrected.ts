import fs from 'fs'
import path from 'path'

function replaceOriginalFilesWithCorrected() {
  console.log('🔄 REMPLACEMENT DES FICHIERS ORIGINAUX PAR LES VERSIONS CORRIGÉES\n')
  
  const dataDir = path.join(__dirname, '..', 'data')
  
  // Liste des fichiers à remplacer
  const filesToReplace = [
    'beauty.json', 'caterers.json', 'decorators.json', 'dresses.json', 'entertainment.json',
    'florist-decoration.json', 'florists.json', 'gifts.json', 'honeymoon.json', 'invitations.json',
    'jewelry.json', 'music-vendors.json', 'officiants.json', 'organization.json', 'photographers.json',
    'suits.json', 'transport.json', 'videographers.json', 'wedding-cakes.json', 'wine-spirits.json'
  ]
  
  let replacedCount = 0
  let skippedCount = 0
  
  for (const fileName of filesToReplace) {
    const originalPath = path.join(dataDir, fileName)
    const correctedPath = path.join(dataDir, `${fileName.replace('.json', '')}-corrected.json`)
    
    // Vérifier que le fichier corrigé existe
    if (!fs.existsSync(correctedPath)) {
      console.log(`⚠️ Fichier corrigé non trouvé: ${fileName}`)
      skippedCount++
      continue
    }
    
    // Créer une sauvegarde de l'original
    const backupPath = path.join(dataDir, `${fileName.replace('.json', '')}-backup.json`)
    
    try {
      // Sauvegarder l'original
      fs.copyFileSync(originalPath, backupPath)
      console.log(`💾 Sauvegarde créée: ${fileName} → ${fileName.replace('.json', '')}-backup.json`)
      
      // Remplacer par la version corrigée
      fs.copyFileSync(correctedPath, originalPath)
      console.log(`✅ Remplacé: ${fileName}`)
      
      // Supprimer le fichier corrigé temporaire
      fs.unlinkSync(correctedPath)
      console.log(`🗑️ Supprimé: ${fileName.replace('.json', '')}-corrected.json`)
      
      replacedCount++
      
    } catch (error) {
      console.error(`❌ Erreur lors du remplacement de ${fileName}:`, error)
      skippedCount++
    }
  }
  
  console.log('\n📊 RÉSULTATS:')
  console.log(`✅ ${replacedCount} fichiers remplacés`)
  console.log(`⚠️ ${skippedCount} fichiers ignorés`)
  
  console.log('\n🎯 ÉTAPES SUIVANTES:')
  console.log('1. Tester la recherche pour vérifier la pertinence')
  console.log('2. Vérifier que les résultats correspondent aux bons types')
  console.log('3. Les fichiers de sauvegarde (*-backup.json) sont disponibles si besoin')
  
  return { replacedCount, skippedCount }
}

// Exécution
if (require.main === module) {
  try {
    const result = replaceOriginalFilesWithCorrected()
    
    console.log('\n🎉 REMPLACEMENT TERMINÉ !')
    console.log(`📊 ${result.replacedCount} fichiers mis à jour`)
    
  } catch (error) {
    console.error('❌ Erreur lors du remplacement:', error)
  }
}

export { replaceOriginalFilesWithCorrected }



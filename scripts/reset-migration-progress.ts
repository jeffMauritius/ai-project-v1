import fs from 'fs'
import path from 'path'

const PROGRESS_FILE = path.join(__dirname, 'migration-progress.json')

function resetProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE)
      console.log('✅ Fichier de progression supprimé')
    } else {
      console.log('ℹ️  Aucun fichier de progression trouvé')
    }
    
    console.log('🔄 La prochaine migration reprendra depuis le début')
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error)
  }
}

resetProgress() 
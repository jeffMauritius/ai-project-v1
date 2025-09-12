const { del, list } = require('@vercel/blob')
require('dotenv').config({ path: '.env.local' })

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function debugDeletion() {
  console.log('🔍 Diagnostic de suppression Vercel Blob...\n')
  
  try {
    // Test 1: Lister les fichiers
    console.log('📋 Test 1: Lister les fichiers establishments...')
    const establishmentsBlobs = await list({
      prefix: 'establishments/',
      limit: 10 // Limiter à 10 pour le test
    })
    
    console.log(`✅ ${establishmentsBlobs.blobs.length} fichiers trouvés`)
    
    if (establishmentsBlobs.blobs.length === 0) {
      console.log('ℹ️ Aucun fichier à supprimer dans establishments/')
      return
    }
    
    // Test 2: Supprimer quelques fichiers
    console.log('\n🗑️ Test 2: Suppression de quelques fichiers...')
    
    for (let i = 0; i < Math.min(3, establishmentsBlobs.blobs.length); i++) {
      const blob = establishmentsBlobs.blobs[i]
      
      try {
        console.log(`\n[${i + 1}/3] Suppression de: ${blob.pathname}`)
        console.log('  📡 Envoi de la requête...')
        
        const startTime = Date.now()
        await del(blob.url)
        const endTime = Date.now()
        
        console.log(`  ✅ Supprimé avec succès (${endTime - startTime}ms)`)
        
        // Pause entre les suppressions
        if (i < 2) {
          console.log('  ⏳ Pause de 2 secondes...')
          await sleep(2000)
        }
        
      } catch (error) {
        console.error(`  ❌ Erreur lors de la suppression:`, error.message)
        console.error(`  🔍 Type d'erreur:`, error.constructor.name)
        console.error(`  📋 Code d'erreur:`, error.code)
        console.error(`  📋 Status:`, error.status)
        console.error(`  📋 Détails complets:`, error)
        
        // Continuer avec le fichier suivant
        continue
      }
    }
    
    console.log('\n🎉 Test de suppression terminé!')
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message)
    console.error('🔍 Type d\'erreur:', error.constructor.name)
    console.error('📋 Détails complets:', error)
  }
}

debugDeletion()

const { del } = require('@vercel/blob')

async function clearVercelBlobFolders() {
  console.log('🗑️ Suppression des dossiers Vercel Blob...')
  
  try {
    // Supprimer le dossier establishments
    console.log('📁 Suppression du dossier establishments...')
    const establishmentsResult = await del({
      prefix: 'establishments/'
    })
    console.log(`✅ Dossier establishments supprimé: ${establishmentsResult.count} fichiers supprimés`)
    
    // Supprimer le dossier partners
    console.log('📁 Suppression du dossier partners...')
    const partnersResult = await del({
      prefix: 'partners/'
    })
    console.log(`✅ Dossier partners supprimé: ${partnersResult.count} fichiers supprimés`)
    
    console.log('🎉 Nettoyage Vercel Blob terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
  }
}

clearVercelBlobFolders()

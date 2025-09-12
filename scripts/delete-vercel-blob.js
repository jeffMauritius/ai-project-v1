const { del, list } = require('@vercel/blob')
require('dotenv').config({ path: '.env.local' })

const BATCH_SIZE = 500 // Réduire la taille des lots
const DELAY_BETWEEN_BATCHES = 30000 // 30 secondes
const MAX_RETRIES = 3 // Nombre de tentatives en cas d'erreur

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function deleteBlobWithRetry(blob, maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await del(blob.url)
      return { success: true, error: null }
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error: error.message }
      }
      
      // Attendre avant de réessayer
      const waitTime = attempt * 5000 // 5s, 10s, 15s
      console.log(`  ⚠️ Tentative ${attempt}/${maxRetries} échouée, nouvelle tentative dans ${waitTime/1000}s...`)
      await sleep(waitTime)
    }
  }
}

async function deleteBlobsInBatches(blobs, folderName) {
  console.log(`📁 Suppression du dossier ${folderName}...`)
  console.log(`📊 Trouvé ${blobs.length} fichiers dans ${folderName}/`)
  
  if (blobs.length === 0) {
    console.log(`  ℹ️ Aucun fichier à supprimer dans ${folderName}/`)
    return { deletedCount: 0, errorCount: 0 }
  }
  
  let deletedCount = 0
  let errorCount = 0
  let skippedCount = 0
  
  for (let i = 0; i < blobs.length; i += BATCH_SIZE) {
    const batch = blobs.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(blobs.length / BATCH_SIZE)
    
    console.log(`\n🔄 Traitement du lot ${batchNumber}/${totalBatches} (${batch.length} fichiers)...`)
    console.log(`📊 Progrès global: ${i + 1}-${Math.min(i + BATCH_SIZE, blobs.length)}/${blobs.length}`)
    
    for (let j = 0; j < batch.length; j++) {
      const blob = batch[j]
      const progress = `[${i + j + 1}/${blobs.length}]`
      
      try {
        const result = await deleteBlobWithRetry(blob)
        
        if (result.success) {
          deletedCount++
          console.log(`  ${progress} ✅ Supprimé: ${blob.pathname}`)
        } else {
          errorCount++
          console.log(`  ${progress} ❌ Échec après ${MAX_RETRIES} tentatives: ${blob.pathname}`)
        }
      } catch (error) {
        errorCount++
        console.log(`  ${progress} ❌ Erreur critique: ${blob.pathname} - ${error.message}`)
      }
      
      // Petite pause entre chaque suppression pour éviter la surcharge
      if (j % 10 === 0 && j > 0) {
        await sleep(1000) // 1 seconde toutes les 10 suppressions
      }
    }
    
    console.log(`  📊 Lot ${batchNumber} terminé: ${deletedCount} supprimés, ${errorCount} erreurs`)
    
    // Temporisation plus longue entre les lots
    if (i + BATCH_SIZE < blobs.length) {
      console.log(`  ⏳ Attente de ${DELAY_BETWEEN_BATCHES/1000} secondes avant le prochain lot...`)
      await sleep(DELAY_BETWEEN_BATCHES)
    }
  }
  
  console.log(`\n✅ Dossier ${folderName}/ terminé: ${deletedCount} supprimés, ${errorCount} erreurs`)
  return { deletedCount, errorCount }
}

async function deleteBlobsWithPagination(prefix, folderName) {
  console.log(`📁 Suppression du dossier ${folderName}...`)
  
  let totalDeleted = 0
  let totalErrors = 0
  let hasMore = true
  let cursor = undefined
  let pageCount = 0
  
  while (hasMore) {
    try {
      pageCount++
      console.log(`\n🔍 Page ${pageCount}: Récupération des fichiers...`)
      
      const result = await list({
        prefix: prefix,
        limit: 100, // Récupérer par petits groupes
        cursor: cursor
      })
      
      console.log(`📊 ${result.blobs.length} fichiers trouvés sur cette page`)
      
      if (result.blobs.length === 0) {
        hasMore = false
        break
      }
      
      // Traiter cette page
      const pageResult = await deleteBlobsInBatches(result.blobs, `${folderName} (page ${pageCount})`)
      totalDeleted += pageResult.deletedCount
      totalErrors += pageResult.errorCount
      
      // Vérifier s'il y a plus de pages
      hasMore = result.hasMore
      cursor = result.cursor
      
      if (hasMore) {
        console.log(`\n⏳ Attente de 5 secondes avant la page suivante...`)
        await sleep(5000)
      }
      
    } catch (error) {
      console.error(`❌ Erreur sur la page ${pageCount}:`, error.message)
      console.log('🔄 Tentative de continuer avec la page suivante...')
      
      // Essayer de continuer malgré l'erreur
      await sleep(10000) // Attendre 10 secondes avant de continuer
      pageCount++
    }
  }
  
  console.log(`\n✅ Dossier ${folderName}/ terminé: ${totalDeleted} supprimés, ${totalErrors} erreurs`)
  return { deletedCount: totalDeleted, errorCount: totalErrors }
}

async function deleteVercelBlobFolders() {
  console.log('🗑️ Suppression de toutes les images Vercel Blob...')
  console.log(`⚙️ Configuration: lots de ${BATCH_SIZE} fichiers, temporisation de ${DELAY_BETWEEN_BATCHES/1000}s entre les lots`)
  console.log(`🔄 Système de retry: ${MAX_RETRIES} tentatives par fichier`)
  console.log(`📄 Pagination: 100 fichiers par page\n`)
  
  let totalDeleted = 0
  let totalErrors = 0
  
  try {
    // Supprimer le dossier establishments avec pagination
    const establishmentsResult = await deleteBlobsWithPagination('establishments/', 'establishments')
    totalDeleted += establishmentsResult.deletedCount
    totalErrors += establishmentsResult.errorCount
    
    // Attendre un peu entre les dossiers
    console.log('\n⏳ Attente de 15 secondes avant de traiter les partenaires...')
    await sleep(15000)
    
    // Supprimer le dossier partners avec pagination
    const partnersResult = await deleteBlobsWithPagination('partners/', 'partners')
    totalDeleted += partnersResult.deletedCount
    totalErrors += partnersResult.errorCount
    
    console.log('\n🎉 Nettoyage Vercel Blob terminé!')
    console.log(`📊 Résumé final: ${totalDeleted} fichiers supprimés, ${totalErrors} erreurs`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    console.log('💡 Le script peut être relancé pour continuer le nettoyage')
  }
}

deleteVercelBlobFolders()

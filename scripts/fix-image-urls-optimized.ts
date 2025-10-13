import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function fixImageUrlsOptimized() {
  const startTime = new Date()
  console.log('🚀 ================================================')
  console.log('🔧 CORRECTION OPTIMISÉE DES URLs D\'IMAGES')
  console.log('🚀 ================================================')
  console.log(`⏰ Début: ${startTime.toLocaleString()}`)
  
  try {
    // Récupérer tous les établissements avec leurs images
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true
      }
    })
    
    console.log(`📊 ${establishments.length} établissements à vérifier`)
    console.log(`🎯 Objectif: Corriger toutes les URLs d'images incorrectes`)
    console.log('')
    
    let fixedCount = 0
    let totalChecked = 0
    let skippedCount = 0
    let errorCount = 0
    
    // Traiter par lots pour optimiser les performances
    const BATCH_SIZE = 10
    const batches = []
    
    for (let i = 0; i < establishments.length; i += BATCH_SIZE) {
      batches.push(establishments.slice(i, i + BATCH_SIZE))
    }
    
    console.log(`📦 Traitement par lots de ${BATCH_SIZE} établissements (${batches.length} lots)`)
    console.log('')
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      
      console.log(`📦 Traitement du lot ${batchIndex + 1}/${batches.length} (${batch.length} établissements)`)
      
      // Traiter le lot en parallèle
      const batchPromises = batch.map(async (establishment) => {
        totalChecked++
        
        if (!establishment.images || establishment.images.length === 0) {
          skippedCount++
          return
        }
        
        // Construire le préfixe du dossier pour cet établissement
        const folderPrefix = `establishments/${establishment.id}/960/`
        
        try {
          // Lister tous les fichiers dans le dossier de cet établissement
          const { blobs } = await list({
            prefix: folderPrefix,
            limit: 100
          })
          
          if (blobs.length === 0) {
            console.log(`⚠️  [${totalChecked}/${establishments.length}] Aucun fichier trouvé pour ${establishment.name}`)
            skippedCount++
            return
          }
          
          // Créer un mapping des fichiers existants
          const existingFiles = new Map<string, string>()
          blobs.forEach(blob => {
            const fileName = blob.url.split('/').pop() || ''
            const imageNumber = extractImageNumber(fileName)
            if (imageNumber !== null) {
              existingFiles.set(imageNumber.toString(), blob.url)
            }
          })
          
          // Corriger les URLs
          const correctedImages: string[] = []
          let hasChanges = false
          
          for (let i = 0; i < establishment.images.length; i++) {
            const originalUrl = establishment.images[i]
            
            // Vérifier si l'URL originale fonctionne (avec timeout)
            try {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 secondes timeout
              
              const response = await fetch(originalUrl, { 
                method: 'HEAD',
                signal: controller.signal
              })
              clearTimeout(timeoutId)
              
              if (response.ok) {
                correctedImages.push(originalUrl)
                continue
              }
            } catch (error) {
              // URL ne fonctionne pas, essayer de la corriger
            }
            
            // Chercher un fichier correspondant dans les fichiers existants
            const imageNumber = i + 1
            const existingFile = existingFiles.get(imageNumber.toString())
            
            if (existingFile) {
              correctedImages.push(existingFile)
              hasChanges = true
            } else {
              // Garder l'URL originale même si elle ne fonctionne pas
              correctedImages.push(originalUrl)
            }
          }
          
          // Mettre à jour la base de données si des changements ont été faits
          if (hasChanges) {
            try {
              await prisma.establishment.update({
                where: { id: establishment.id },
                data: { images: correctedImages }
              })
              fixedCount++
              console.log(`✅ [${totalChecked}/${establishments.length}] ${establishment.name} corrigé`)
            } catch (error) {
              console.error(`❌ [${totalChecked}/${establishments.length}] Erreur lors de la mise à jour de ${establishment.name}:`, error)
              errorCount++
            }
          }
          
        } catch (error) {
          console.error(`❌ [${totalChecked}/${establishments.length}] Erreur lors de la vérification de ${establishment.name}:`, error)
          errorCount++
        }
      })
      
      // Attendre que le lot soit terminé
      await Promise.all(batchPromises)
      
      // Délai entre les lots pour éviter de surcharger l'API
      if (batchIndex < batches.length - 1) {
        console.log(`⏳ Pause de 2 secondes avant le prochain lot...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      // Rapport de progrès après chaque lot
      const elapsed = new Date().getTime() - startTime.getTime()
      const elapsedMinutes = Math.floor(elapsed / 60000)
      const elapsedSeconds = Math.floor((elapsed % 60000) / 1000)
      const rate = totalChecked / (elapsed / 1000)
      const estimatedTotal = establishments.length / rate
      const remaining = Math.max(0, estimatedTotal - elapsed / 1000)
      const remainingMinutes = Math.floor(remaining / 60)
      const remainingSeconds = Math.floor(remaining % 60)
      
      console.log('')
      console.log('📈 ========== RAPPORT DE PROGRÈS ==========')
      console.log(`⏱️  Temps écoulé: ${elapsedMinutes}m ${elapsedSeconds}s`)
      console.log(`📊 Progrès: ${totalChecked}/${establishments.length} (${((totalChecked/establishments.length)*100).toFixed(1)}%)`)
      console.log(`✅ Corrigés: ${fixedCount}`)
      console.log(`⏭️  Ignorés: ${skippedCount}`)
      console.log(`❌ Erreurs: ${errorCount}`)
      console.log(`🚀 Vitesse: ${rate.toFixed(2)} établissements/seconde`)
      console.log(`⏳ Temps restant estimé: ${remainingMinutes}m ${remainingSeconds}s`)
      console.log('==========================================')
      console.log('')
    }
    
    const endTime = new Date()
    const totalTime = endTime.getTime() - startTime.getTime()
    const totalMinutes = Math.floor(totalTime / 60000)
    const totalSeconds = Math.floor((totalTime % 60000) / 1000)
    
    console.log('')
    console.log('🎉 ========== CORRECTION TERMINÉE ==========')
    console.log(`⏰ Début: ${startTime.toLocaleString()}`)
    console.log(`⏰ Fin: ${endTime.toLocaleString()}`)
    console.log(`⏱️  Durée totale: ${totalMinutes}m ${totalSeconds}s`)
    console.log(`📊 Résultats:`)
    console.log(`   • Total vérifiés: ${totalChecked}/${establishments.length}`)
    console.log(`   • Corrigés: ${fixedCount}`)
    console.log(`   • Ignorés: ${skippedCount}`)
    console.log(`   • Erreurs: ${errorCount}`)
    console.log(`📈 Taux de succès: ${((fixedCount/totalChecked)*100).toFixed(1)}%`)
    console.log(`🚀 Vitesse moyenne: ${(totalChecked/(totalTime/1000)).toFixed(2)} établissements/seconde`)
    console.log('==========================================')
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function extractImageNumber(fileName: string): number | null {
  // Extraire le numéro d'image du nom de fichier
  // Formats supportés: image-1.webp, image-1-hash.webp, image1.webp, img-1.webp, etc.
  const patterns = [
    /image-(\d+)/,
    /image(\d+)/,
    /img-(\d+)/,
    /img(\d+)/
  ]
  
  for (const pattern of patterns) {
    const match = fileName.match(pattern)
    if (match) {
      return parseInt(match[1])
    }
  }
  
  return null
}

fixImageUrlsOptimized()

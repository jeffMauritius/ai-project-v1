import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function fixImageUrlsSmart() {
  const startTime = new Date()
  console.log('🚀 ================================================')
  console.log('🔧 CORRECTION INTELLIGENTE DES URLs D\'IMAGES')
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
    
    for (const establishment of establishments) {
      totalChecked++
      
      // Logs de progrès détaillés
      if (totalChecked % 50 === 0) {
        const elapsed = new Date().getTime() - startTime.getTime()
        const elapsedMinutes = Math.floor(elapsed / 60000)
        const elapsedSeconds = Math.floor((elapsed % 60000) / 1000)
        const rate = totalChecked / (elapsed / 1000) // établissements par seconde
        const estimatedTotal = establishments.length / rate // temps total estimé en secondes
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
      
      if (!establishment.images || establishment.images.length === 0) {
        skippedCount++
        continue
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
          continue
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
          
          // Vérifier si l'URL originale fonctionne
          try {
            const response = await fetch(originalUrl, { method: 'HEAD' })
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
            
            if (fixedCount % 10 === 0) {
              console.log(`✅ [${totalChecked}/${establishments.length}] ${fixedCount} établissements corrigés`)
            }
          } catch (error) {
            console.error(`❌ [${totalChecked}/${establishments.length}] Erreur lors de la mise à jour de ${establishment.name}:`, error)
            errorCount++
          }
        }
        
      } catch (error) {
        console.error(`❌ [${totalChecked}/${establishments.length}] Erreur lors de la vérification de ${establishment.name}:`, error)
        errorCount++
      }
      
      // Délai pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 200))
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

fixImageUrlsSmart()

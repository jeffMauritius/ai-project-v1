import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function fixImageUrlsSmart() {
  try {
    console.log('🔧 Correction intelligente des URLs d\'images des établissements...')
    
    // Récupérer tous les établissements avec leurs images
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true
      }
    })
    
    console.log(`📊 ${establishments.length} établissements à vérifier`)
    
    let fixedCount = 0
    let totalChecked = 0
    
    for (const establishment of establishments) {
      totalChecked++
      
      if (totalChecked % 50 === 0) {
        console.log(`📈 Progrès: ${totalChecked}/${establishments.length} établissements vérifiés`)
      }
      
      if (!establishment.images || establishment.images.length === 0) {
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
          console.log(`⚠️  Aucun fichier trouvé pour ${establishment.name}`)
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
              console.log(`✅ ${fixedCount} établissements corrigés`)
            }
          } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour de ${establishment.name}:`, error)
          }
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de la vérification de ${establishment.name}:`, error)
      }
      
      // Délai pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log(`\n🎉 Correction terminée !`)
    console.log(`📊 ${fixedCount} établissements corrigés sur ${establishments.length} vérifiés`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
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

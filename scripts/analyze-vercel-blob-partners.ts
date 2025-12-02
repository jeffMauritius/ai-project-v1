import { PrismaClient } from '@prisma/client'
import { put, list, del } from '@vercel/blob'

const prisma = new PrismaClient()

interface PartnerImageAnalysis {
  partnerId: string
  companyName: string
  serviceType: string
  mongoImagesCount: number
  vercelImagesCount: number
  vercelImages: string[]
  mongoImages: string[]
  matchingUrls: string[]
  nonMatchingUrls: string[]
  hasVercelFolder: boolean
  needsReimport: boolean
  hasDuplicates: boolean
  duplicateCount: number
  status: 'OK' | 'MISSING' | 'INCOMPLETE' | 'ERROR' | 'URL_MISMATCH' | 'DUPLICATES' | 'FIXED' | 'PENDING_FIX'
  proposedAction?: string
  correctedUrls?: string[]
}

async function analyzeSpecificPartner(partnerName: string) {
  try {
    console.log(`🔍 Analyse spécifique du partenaire: ${partnerName}`)
    console.log('==============================================')

    const partner = await prisma.partner.findFirst({
      where: {
        companyName: partnerName
      },
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        images: true
      }
    })

    if (!partner) {
      console.log(`❌ Partenaire "${partnerName}" non trouvé`)
      return
    }

    console.log(`✅ Partenaire trouvé: ${partner.companyName} (ID: ${partner.id})`)
    console.log(`📊 Images MongoDB: ${partner.images?.length || 0}`)
    
    if (partner.images && partner.images.length > 0) {
      console.log(`📋 URLs MongoDB:`)
      partner.images.forEach((url, idx) => {
        console.log(`  ${idx + 1}. ${url}`)
      })
    }

    // Vérifier Vercel Blob
    const folderPath = `partners/${partner.id}/960/`
    const { blobs } = await list({
      prefix: folderPath,
      limit: 100
    })

    console.log(`📊 Images Vercel: ${blobs?.length || 0}`)
    if (blobs && blobs.length > 0) {
      console.log(`📋 URLs Vercel:`)
      blobs.forEach((blob, idx) => {
        console.log(`  ${idx + 1}. ${blob.url}`)
      })
    }

    // Comparer les URLs
    if (partner.images && blobs) {
      const vercelUrls = new Set(blobs.map(blob => blob.url))
      const matchingUrls = partner.images.filter(url => vercelUrls.has(url))
      const nonMatchingUrls = partner.images.filter(url => !vercelUrls.has(url))

      console.log(`\n🔍 COMPARAISON:`)
      console.log(`✅ URLs qui matchent (${matchingUrls.length}):`)
      matchingUrls.forEach((url, idx) => {
        console.log(`  ${idx + 1}. ${url}`)
      })
      
      console.log(`❌ URLs non-matching (${nonMatchingUrls.length}):`)
      nonMatchingUrls.forEach((url, idx) => {
        console.log(`  ${idx + 1}. ${url}`)
      })
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'analyse spécifique:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

async function fixPartnerUrls(dryRun: boolean = true) {
  try {
    console.log(`🔧 ${dryRun ? 'SIMULATION' : 'CORRECTION'} des URLs des partenaires`)
    console.log('==============================================')

    // 1. Récupérer tous les partenaires
    console.log('\n📊 Récupération de tous les partenaires...')
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        images: true
      },
      orderBy: {
        companyName: 'asc'
      }
    })

    console.log(`✅ ${partners.length} partenaires trouvés`)

    const results: PartnerImageAnalysis[] = []
    let fixedCount = 0
    let duplicateRemovedCount = 0

    // 2. Grouper les partenaires par nom pour détecter les doublons
    const partnersByName = new Map<string, typeof partners>()
    partners.forEach(partner => {
      if (!partnersByName.has(partner.companyName)) {
        partnersByName.set(partner.companyName, [])
      }
      partnersByName.get(partner.companyName)!.push(partner)
    })

    console.log(`\n🔍 Détection de ${partnersByName.size} groupes de partenaires`)
    console.log(`⏱️  Traitement en cours... (cela peut prendre plusieurs minutes)`)

    let processedGroups = 0
    const totalGroups = partnersByName.size

    for (const [companyName, partnerGroup] of partnersByName) {
      processedGroups++
      
      // Afficher la progression tous les 100 groupes
      if (processedGroups % 100 === 0 || processedGroups === totalGroups) {
        console.log(`\n📊 Progression: ${processedGroups}/${totalGroups} groupes traités (${Math.round(processedGroups/totalGroups*100)}%)`)
      }
      
      // Log détaillé seulement pour les premiers groupes ou ceux avec des problèmes
      if (processedGroups <= 10 || partnerGroup.length > 1) {
        console.log(`\n🔍 Traitement: ${companyName} (${partnerGroup.length} entrée${partnerGroup.length > 1 ? 's' : ''})`)
      }

      // 3. Pour chaque groupe, analyser les URLs Vercel
      const groupAnalysis: PartnerImageAnalysis[] = []
      
      for (const partner of partnerGroup) {
        const analysis: PartnerImageAnalysis = {
          partnerId: partner.id,
          companyName: partner.companyName,
          serviceType: partner.serviceType,
          mongoImagesCount: partner.images?.length || 0,
          vercelImagesCount: 0,
          vercelImages: [],
          mongoImages: partner.images || [],
          matchingUrls: [],
          nonMatchingUrls: [],
          hasVercelFolder: false,
          needsReimport: false,
          hasDuplicates: false,
          duplicateCount: 0,
          status: 'OK',
          proposedAction: '',
          correctedUrls: []
        }

        try {
          // Vérifier Vercel Blob
          const folderPath = `partners/${partner.id}/960/`
          const { blobs } = await list({
            prefix: folderPath,
            limit: 100
          })

          if (blobs && blobs.length > 0) {
            analysis.hasVercelFolder = true
            analysis.vercelImagesCount = blobs.length
            analysis.vercelImages = blobs.map(blob => blob.url)
            
            // Dédupliquer les URLs Vercel (au cas où il y aurait des doublons)
            analysis.correctedUrls = [...new Set(analysis.vercelImages)]
            
            // Comparer avec MongoDB
            const vercelUrls = new Set(analysis.vercelImages)
            analysis.matchingUrls = analysis.mongoImages.filter(url => vercelUrls.has(url))
            analysis.nonMatchingUrls = analysis.mongoImages.filter(url => !vercelUrls.has(url))
            
            // Déterminer l'action
            if (analysis.nonMatchingUrls.length > 0) {
              analysis.status = dryRun ? 'PENDING_FIX' : 'FIXED'
              analysis.proposedAction = `Mettre à jour ${analysis.nonMatchingUrls.length} URL${analysis.nonMatchingUrls.length > 1 ? 's' : ''} avec ${analysis.correctedUrls.length} URL${analysis.correctedUrls.length > 1 ? 's' : ''} Vercel`
            } else if (analysis.mongoImagesCount !== analysis.correctedUrls.length) {
              analysis.status = dryRun ? 'PENDING_FIX' : 'FIXED'
              analysis.proposedAction = `Dédupliquer: ${analysis.mongoImagesCount} → ${analysis.correctedUrls.length} URLs`
            }
          } else {
            analysis.status = 'MISSING'
            analysis.proposedAction = 'Aucune image sur Vercel'
          }

          groupAnalysis.push(analysis)

        } catch (error: any) {
          console.error(`   ❌ Erreur pour ${partner.companyName}:`, error.message)
          analysis.status = 'ERROR'
          analysis.proposedAction = 'Erreur lors de l\'analyse'
          groupAnalysis.push(analysis)
        }
      }

      // 4. Pour les groupes avec doublons, choisir le meilleur partenaire
      if (partnerGroup.length > 1) {
        console.log(`   🔄 Groupe avec ${partnerGroup.length} doublons détectés`)
        
        // Trouver le partenaire avec le plus d'images Vercel valides
        const bestPartner = groupAnalysis.reduce((best, current) => {
          if (current.vercelImagesCount > best.vercelImagesCount) {
            return current
          }
          return best
        })

        console.log(`   ✅ Meilleur partenaire: ${bestPartner.partnerId} (${bestPartner.vercelImagesCount} images Vercel)`)
        
        // Marquer les autres comme à supprimer
        groupAnalysis.forEach(analysis => {
          if (analysis.partnerId !== bestPartner.partnerId) {
            analysis.status = dryRun ? 'PENDING_FIX' : 'FIXED'
            analysis.proposedAction = `SUPPRIMER (doublon de ${bestPartner.partnerId})`
            duplicateRemovedCount++
          }
        })
      }

      // 5. Appliquer les corrections
      for (const analysis of groupAnalysis) {
        if (analysis.status === 'PENDING_FIX' || analysis.status === 'FIXED') {
          if (analysis.proposedAction?.includes('SUPPRIMER')) {
            if (!dryRun) {
              await prisma.partner.delete({
                where: { id: analysis.partnerId }
              })
              console.log(`   🗑️  Partenaire supprimé: ${analysis.partnerId}`)
            } else {
              console.log(`   🗑️  [SIMULATION] Partenaire à supprimer: ${analysis.partnerId}`)
            }
          } else if (analysis.correctedUrls && analysis.correctedUrls.length > 0) {
            if (!dryRun) {
              await prisma.partner.update({
                where: { id: analysis.partnerId },
                data: { images: analysis.correctedUrls }
              })
              console.log(`   ✅ URLs mises à jour: ${analysis.partnerId} (${analysis.correctedUrls.length} URLs)`)
              fixedCount++
            } else {
              console.log(`   ✅ [SIMULATION] URLs à mettre à jour: ${analysis.partnerId} (${analysis.correctedUrls.length} URLs)`)
            }
          }
        }
      }

      results.push(...groupAnalysis)
      
      // Pause périodique pour éviter de surcharger l'API Vercel
      if (processedGroups % 50 === 0) {
        console.log(`⏸️  Pause de 2 secondes...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // 6. Rapport final
    console.log(`\n📊 RAPPORT DE ${dryRun ? 'SIMULATION' : 'CORRECTION'}`)
    console.log('==============================================')
    console.log(`Total partenaires traités: ${results.length}`)
    console.log(`Partenaires corrigés: ${fixedCount}`)
    console.log(`Doublons supprimés: ${duplicateRemovedCount}`)
    
    const pendingFixes = results.filter(r => r.status === 'PENDING_FIX').length
    const fixed = results.filter(r => r.status === 'FIXED').length
    
    console.log(`Actions ${dryRun ? 'proposées' : 'effectuées'}: ${dryRun ? pendingFixes : fixed}`)

    if (dryRun) {
      console.log(`\n💡 Pour appliquer les corrections, relancez avec: npx tsx scripts/analyze-vercel-blob-partners.ts --fix`)
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la correction:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

async function analyzeVercelBlobPartners() {
  try {
    console.log('🔍 Analyse du blob Vercel pour les partenaires')
    console.log('==============================================')

    // 1. Récupérer les 50 premiers partenaires de la base MongoDB
    console.log('\n📊 Récupération des 50 premiers partenaires depuis MongoDB...')
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        images: true
      },
      orderBy: {
        companyName: 'asc'
      },
      take: 50
    })

    console.log(`✅ ${partners.length} partenaires trouvés (limité à 50 pour le test)`)

    // 2. Analyser chaque partenaire
    const analysisResults: PartnerImageAnalysis[] = []
    let processedCount = 0

    for (const partner of partners) {
      processedCount++
      console.log(`\n🔍 Analyse ${processedCount}/${partners.length}: ${partner.companyName}`)
      
      const analysis: PartnerImageAnalysis = {
        partnerId: partner.id,
        companyName: partner.companyName,
        serviceType: partner.serviceType,
        mongoImagesCount: partner.images?.length || 0,
        vercelImagesCount: 0,
        vercelImages: [],
        mongoImages: partner.images || [],
        matchingUrls: [],
        nonMatchingUrls: [],
        hasVercelFolder: false,
        needsReimport: false,
        hasDuplicates: false,
        duplicateCount: 0,
        status: 'OK'
      }

      try {
        // Vérifier si le dossier 960 existe dans Vercel Blob
        const folderPath = `partners/${partner.id}/960/`
        
        // Lister les fichiers dans le dossier 960
        const { blobs } = await list({
          prefix: folderPath,
          limit: 100
        })

        if (blobs && blobs.length > 0) {
          analysis.hasVercelFolder = true
          analysis.vercelImagesCount = blobs.length
          analysis.vercelImages = blobs.map(blob => blob.url)
          
          // Analyser les correspondances d'URLs
          const vercelUrls = new Set(analysis.vercelImages)
          const mongoUrls = analysis.mongoImages
          
          // Trouver les URLs qui matchent
          analysis.matchingUrls = mongoUrls.filter(url => vercelUrls.has(url))
          analysis.nonMatchingUrls = mongoUrls.filter(url => !vercelUrls.has(url))
          
          // Détecter les doublons dans MongoDB
          const urlCounts = new Map<string, number>()
          mongoUrls.forEach(url => {
            urlCounts.set(url, (urlCounts.get(url) || 0) + 1)
          })
          
          const duplicates = Array.from(urlCounts.entries()).filter(([_, count]) => count > 1)
          if (duplicates.length > 0) {
            analysis.hasDuplicates = true
            analysis.duplicateCount = duplicates.reduce((sum, [_, count]) => sum + count - 1, 0)
          }
          
          // Déterminer le statut
          if (analysis.hasDuplicates) {
            analysis.status = 'DUPLICATES'
            analysis.needsReimport = true
          } else if (analysis.nonMatchingUrls.length > 0) {
            analysis.status = 'URL_MISMATCH'
            analysis.needsReimport = true
          } else if (analysis.mongoImagesCount === 0 && analysis.vercelImagesCount > 0) {
            analysis.status = 'INCOMPLETE'
            analysis.needsReimport = true
          } else if (analysis.mongoImagesCount > 0 && analysis.vercelImagesCount === 0) {
            analysis.status = 'MISSING'
            analysis.needsReimport = true
          } else if (analysis.mongoImagesCount !== analysis.vercelImagesCount) {
            analysis.status = 'INCOMPLETE'
            analysis.needsReimport = true
          }
        } else {
          analysis.hasVercelFolder = false
          if (analysis.mongoImagesCount > 0) {
            analysis.status = 'MISSING'
            analysis.needsReimport = true
          }
        }

                console.log(`   MongoDB: ${analysis.mongoImagesCount} images`)
                console.log(`   Vercel: ${analysis.vercelImagesCount} images`)
                console.log(`   URLs qui matchent: ${analysis.matchingUrls.length}`)
                console.log(`   URLs non-matching: ${analysis.nonMatchingUrls.length}`)
                if (analysis.hasDuplicates) {
                  console.log(`   ⚠️  Doublons détectés: ${analysis.duplicateCount}`)
                }
                console.log(`   Status: ${analysis.status}`)
                
                // Afficher les URLs détaillées pour les cas problématiques
                if (analysis.status === 'URL_MISMATCH' && processedCount <= 5) {
                  console.log(`   📋 URLs MongoDB:`)
                  analysis.mongoImages.forEach((url, idx) => {
                    console.log(`     ${idx + 1}. ${url}`)
                  })
                  console.log(`   📋 URLs Vercel:`)
                  analysis.vercelImages.forEach((url, idx) => {
                    console.log(`     ${idx + 1}. ${url}`)
                  })
                  console.log(`   ✅ URLs qui matchent:`)
                  analysis.matchingUrls.forEach((url, idx) => {
                    console.log(`     ${idx + 1}. ${url}`)
                  })
                  console.log(`   ❌ URLs non-matching:`)
                  analysis.nonMatchingUrls.forEach((url, idx) => {
                    console.log(`     ${idx + 1}. ${url}`)
                  })
                }

      } catch (error) {
        console.error(`   ❌ Erreur pour ${partner.companyName}:`, error.message)
        analysis.status = 'ERROR'
        analysis.needsReimport = true
      }

      analysisResults.push(analysis)
      
      // Pause pour éviter de surcharger l'API Vercel
      if (processedCount % 10 === 0) {
        console.log(`\n⏸️  Pause de 2 secondes...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // 3. Générer le rapport
    console.log('\n📊 RAPPORT D\'ANALYSE')
    console.log('====================')

    const stats = {
      total: analysisResults.length,
      ok: analysisResults.filter(r => r.status === 'OK').length,
      missing: analysisResults.filter(r => r.status === 'MISSING').length,
      incomplete: analysisResults.filter(r => r.status === 'INCOMPLETE').length,
      urlMismatch: analysisResults.filter(r => r.status === 'URL_MISMATCH').length,
      duplicates: analysisResults.filter(r => r.status === 'DUPLICATES').length,
      error: analysisResults.filter(r => r.status === 'ERROR').length,
      needsReimport: analysisResults.filter(r => r.needsReimport).length
    }

    console.log(`\n📈 STATISTIQUES GÉNÉRALES:`)
    console.log(`   Total partenaires: ${stats.total}`)
    console.log(`   ✅ OK: ${stats.ok}`)
    console.log(`   ❌ Manquants: ${stats.missing}`)
    console.log(`   ⚠️  Incomplets: ${stats.incomplete}`)
    console.log(`   🔗 URLs non-matching: ${stats.urlMismatch}`)
    console.log(`   🔄 Doublons: ${stats.duplicates}`)
    console.log(`   🔥 Erreurs: ${stats.error}`)
    console.log(`   🔄 Nécessitent réimportation: ${stats.needsReimport}`)

    // 4. Détail par statut
    console.log(`\n📋 DÉTAIL PAR STATUT:`)
    
    const missingPartners = analysisResults.filter(r => r.status === 'MISSING')
    if (missingPartners.length > 0) {
      console.log(`\n❌ PARTENAIRES MANQUANTS (${missingPartners.length}):`)
      missingPartners.forEach(partner => {
        console.log(`   - ${partner.companyName} (${partner.serviceType}) - MongoDB: ${partner.mongoImagesCount}, Vercel: ${partner.vercelImagesCount}`)
      })
    }

    const incompletePartners = analysisResults.filter(r => r.status === 'INCOMPLETE')
    if (incompletePartners.length > 0) {
      console.log(`\n⚠️  PARTENAIRES INCOMPLETS (${incompletePartners.length}):`)
      incompletePartners.forEach(partner => {
        console.log(`   - ${partner.companyName} (${partner.serviceType}) - MongoDB: ${partner.mongoImagesCount}, Vercel: ${partner.vercelImagesCount}`)
      })
    }

    const urlMismatchPartners = analysisResults.filter(r => r.status === 'URL_MISMATCH')
    if (urlMismatchPartners.length > 0) {
      console.log(`\n🔗 PARTENAIRES AVEC URLs NON-MATCHING (${urlMismatchPartners.length}):`)
      urlMismatchPartners.forEach(partner => {
        console.log(`   - ${partner.companyName} (${partner.serviceType}) - URLs non-matching: ${partner.nonMatchingUrls.length}`)
      })
    }

    const duplicatePartners = analysisResults.filter(r => r.status === 'DUPLICATES')
    if (duplicatePartners.length > 0) {
      console.log(`\n🔄 PARTENAIRES AVEC DOUBLONS (${duplicatePartners.length}):`)
      duplicatePartners.forEach(partner => {
        console.log(`   - ${partner.companyName} (${partner.serviceType}) - Doublons: ${partner.duplicateCount}`)
      })
    }

    const errorPartners = analysisResults.filter(r => r.status === 'ERROR')
    if (errorPartners.length > 0) {
      console.log(`\n🔥 PARTENAIRES AVEC ERREURS (${errorPartners.length}):`)
      errorPartners.forEach(partner => {
        console.log(`   - ${partner.companyName} (${partner.serviceType})`)
      })
    }

    // 5. Sauvegarder le rapport détaillé
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: stats,
      partners: analysisResults
    }

    const fs = await import('fs/promises')
    await fs.writeFile(
      'data/vercel-blob-analysis-report.json',
      JSON.stringify(reportData, null, 2)
    )

    console.log(`\n💾 Rapport détaillé sauvegardé dans: data/vercel-blob-analysis-report.json`)

    // 6. Recommandations
    console.log(`\n💡 RECOMMANDATIONS:`)
    if (stats.needsReimport > 0) {
      console.log(`   🔄 ${stats.needsReimport} partenaires nécessitent une réimportation d'images`)
      console.log(`   📝 Consultez le rapport détaillé pour la liste complète`)
    } else {
      console.log(`   ✅ Tous les partenaires ont leurs images correctement synchronisées`)
    }

    return analysisResults

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
    return []
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter l'analyse
const command = process.argv[2]

if (command === '--specific') {
  const partnerName = process.argv[3]
  if (partnerName) {
    analyzeSpecificPartner(partnerName).catch(console.error)
  } else {
    console.log('Usage: npx tsx scripts/analyze-vercel-blob-partners.ts --specific "Nom du partenaire"')
  }
} else if (command === '--fix') {
  // Mode correction (applique les changements)
  fixPartnerUrls(false).catch(console.error)
} else if (command === '--dry-run') {
  // Mode simulation (ne fait que proposer les changements)
  fixPartnerUrls(true).catch(console.error)
} else {
  // Analyse générale des 50 premiers (mode par défaut)
  analyzeVercelBlobPartners().catch(console.error)
}

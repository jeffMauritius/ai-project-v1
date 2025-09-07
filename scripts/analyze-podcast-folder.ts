import { list } from '@vercel/blob'

interface PodcastFile {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
  contentType?: string
}

interface PodcastAnalysis {
  totalFiles: number
  totalSize: number
  fileTypes: { [key: string]: number }
  sizeByType: { [key: string]: number }
  files: PodcastFile[]
  oldestFile?: Date
  newestFile?: Date
}

class PodcastAnalyzer {
  async analyzePodcastFolder(): Promise<PodcastAnalysis> {
    console.log('🎙️  ANALYSE DU DOSSIER PODCAST SUR VERCEL BLOB')
    console.log('==================================================')
    
    try {
      // Lister tous les fichiers dans le dossier podcast
      console.log('📂 Récupération de la liste des fichiers...')
      const { blobs } = await list({
        prefix: 'podcast/',
        limit: 1000 // Limite maximale pour éviter les timeouts
      })
      
      console.log(`📊 ${blobs.length} fichiers trouvés dans le dossier podcast`)
      
      if (blobs.length === 0) {
        console.log('ℹ️  Aucun fichier trouvé dans le dossier podcast')
        return {
          totalFiles: 0,
          totalSize: 0,
          fileTypes: {},
          sizeByType: {},
          files: []
        }
      }
      
      // Analyser les fichiers
      const analysis: PodcastAnalysis = {
        totalFiles: blobs.length,
        totalSize: 0,
        fileTypes: {},
        sizeByType: {},
        files: [],
        oldestFile: undefined,
        newestFile: undefined
      }
      
      console.log('\n📋 ANALYSE DES FICHIERS:')
      console.log('=' .repeat(50))
      
      for (const blob of blobs) {
        const file: PodcastFile = {
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: new Date(blob.uploadedAt),
          contentType: blob.contentType
        }
        
        analysis.files.push(file)
        analysis.totalSize += blob.size
        
        // Analyser le type de fichier
        const extension = this.getFileExtension(blob.pathname)
        analysis.fileTypes[extension] = (analysis.fileTypes[extension] || 0) + 1
        analysis.sizeByType[extension] = (analysis.sizeByType[extension] || 0) + blob.size
        
        // Dates min/max
        if (!analysis.oldestFile || file.uploadedAt < analysis.oldestFile) {
          analysis.oldestFile = file.uploadedAt
        }
        if (!analysis.newestFile || file.uploadedAt > analysis.newestFile) {
          analysis.newestFile = file.uploadedAt
        }
        
        console.log(`📄 ${blob.pathname}`)
        console.log(`   📏 Taille: ${this.formatFileSize(blob.size)}`)
        console.log(`   📅 Uploadé: ${file.uploadedAt.toLocaleString()}`)
        console.log(`   🔗 URL: ${blob.url.substring(0, 80)}...`)
        console.log('')
      }
      
      // Afficher les statistiques
      this.printStatistics(analysis)
      
      return analysis
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse:', error)
      throw error
    }
  }
  
  private getFileExtension(pathname: string): string {
    const parts = pathname.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'sans-extension'
  }
  
  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
  
  private printStatistics(analysis: PodcastAnalysis) {
    console.log('\n📊 STATISTIQUES DU DOSSIER PODCAST:')
    console.log('=' .repeat(50))
    console.log(`📁 Total fichiers: ${analysis.totalFiles}`)
    console.log(`📏 Taille totale: ${this.formatFileSize(analysis.totalSize)}`)
    
    if (analysis.oldestFile && analysis.newestFile) {
      console.log(`📅 Période: ${analysis.oldestFile.toLocaleDateString()} - ${analysis.newestFile.toLocaleDateString()}`)
    }
    
    console.log('\n📋 RÉPARTITION PAR TYPE DE FICHIER:')
    console.log('-' .repeat(30))
    Object.entries(analysis.fileTypes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        const size = analysis.sizeByType[type]
        const percentage = ((count / analysis.totalFiles) * 100).toFixed(1)
        console.log(`  ${type}: ${count} fichiers (${percentage}%) - ${this.formatFileSize(size)}`)
      })
    
    console.log('\n🔍 FICHIERS LES PLUS VOLUMINEUX:')
    console.log('-' .repeat(30))
    analysis.files
      .sort((a, b) => b.size - a.size)
      .slice(0, 5)
      .forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.pathname}`)
        console.log(`     📏 ${this.formatFileSize(file.size)}`)
        console.log(`     📅 ${file.uploadedAt.toLocaleString()}`)
      })
    
    console.log('\n📂 STRUCTURE DU DOSSIER:')
    console.log('-' .repeat(30))
    const folders = new Set<string>()
    analysis.files.forEach(file => {
      const parts = file.pathname.split('/')
      if (parts.length > 2) {
        folders.add(parts.slice(0, 2).join('/'))
      }
    })
    
    if (folders.size > 0) {
      Array.from(folders).sort().forEach(folder => {
        const filesInFolder = analysis.files.filter(f => f.pathname.startsWith(folder))
        const folderSize = filesInFolder.reduce((sum, f) => sum + f.size, 0)
        console.log(`  📁 ${folder}/`)
        console.log(`     📄 ${filesInFolder.length} fichiers`)
        console.log(`     📏 ${this.formatFileSize(folderSize)}`)
      })
    } else {
      console.log('  📁 Tous les fichiers sont à la racine du dossier podcast/')
    }
  }
}

// Exécution du script
async function main() {
  const analyzer = new PodcastAnalyzer()
  
  try {
    await analyzer.analyzePodcastFolder()
    console.log('\n✅ Analyse terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { PodcastAnalyzer }

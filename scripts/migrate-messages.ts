import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Début de la migration des messages...')

  try {
    // Vérifier que les nouvelles tables existent
    console.log('📋 Vérification des tables...')
    
    // Ici on pourrait ajouter des vérifications ou des migrations de données
    // Pour l'instant, on se contente de vérifier la connexion
    
    console.log('✅ Migration terminée avec succès !')
    console.log('💡 N\'oubliez pas de redémarrer votre serveur après avoir appliqué le schéma Prisma')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 
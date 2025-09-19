import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  try {
    console.log('🔍 Test de connexion à la base de données...')
    
    // Test simple de connexion
    await prisma.$connect()
    console.log('✅ Connexion à MongoDB réussie')
    
    // Test d'une requête simple
    const userCount = await prisma.user.count()
    console.log(`✅ Nombre d'utilisateurs: ${userCount}`)
    
    // Test des plans d'abonnement
    const planCount = await prisma.subscriptionPlan.count()
    console.log(`✅ Nombre de plans d'abonnement: ${planCount}`)
    
    console.log('🎉 Base de données accessible et fonctionnelle!')
    
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error)
    
    if (error.message.includes('Authentication failed')) {
      console.log('💡 Solution: Vérifiez vos identifiants MongoDB Atlas')
      console.log('   1. Allez sur https://cloud.mongodb.com/')
      console.log('   2. Vérifiez que l\'utilisateur "aiproject" existe')
      console.log('   3. Vérifiez que le mot de passe est correct')
      console.log('   4. Vérifiez que l\'IP est autorisée')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()

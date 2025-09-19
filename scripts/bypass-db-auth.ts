import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function bypassDatabaseAuth() {
  try {
    console.log('🔧 Contournement de l\'authentification de base de données...')
    
    // Test de connexion directe
    console.log('📡 Test de connexion directe à MongoDB...')
    await prisma.$connect()
    console.log('✅ Connexion directe réussie')
    
    // Créer un utilisateur de test
    const email = 'test@stripe.com'
    const password = 'password123'
    const name = 'Test User'
    
    console.log('�� Création d\'un utilisateur de test...')
    
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findFirst({
      where: { email }
    })
    
    if (existingUser) {
      console.log('✅ Utilisateur de test existe déjà:')
      console.log('   ID:', existingUser.id)
      console.log('   Email:', existingUser.email)
      console.log('   Nom:', existingUser.name)
    } else {
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash(password, 12)
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'USER'
        }
      })
      
      console.log('✅ Utilisateur de test créé:')
      console.log('   ID:', user.id)
      console.log('   Email:', user.email)
      console.log('   Nom:', user.name)
    }
    
    console.log('🎯 Identifiants de connexion:')
    console.log('   Email: test@stripe.com')
    console.log('   Mot de passe: password123')
    
    console.log('🌐 Vous pouvez maintenant:')
    console.log('   1. Aller sur http://localhost:3000/auth/login')
    console.log('   2. Vous connecter avec ces identifiants')
    console.log('   3. Tester l\'intégration Stripe')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    
    if (error.message.includes('Authentication failed')) {
      console.log('💡 Solution alternative:')
      console.log('   1. Vérifiez vos identifiants MongoDB Atlas')
      console.log('   2. Ou utilisez le mode test sans base de données')
    }
  } finally {
    await prisma.$disconnect()
  }
}

bypassDatabaseAuth()

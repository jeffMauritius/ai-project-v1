import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    console.log('👤 Création d\'un utilisateur de test...')
    
    const email = 'test@stripe.com'
    const password = 'password123'
    const name = 'Test User'
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      console.log('✅ Utilisateur de test existe déjà:', email)
      console.log('   ID:', existingUser.id)
      console.log('   Nom:', existingUser.name)
      console.log('   Email:', existingUser.email)
      return existingUser
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER'
      }
    })
    
    console.log('✅ Utilisateur de test créé avec succès!')
    console.log('   ID:', user.id)
    console.log('   Nom:', user.name)
    console.log('   Email:', user.email)
    console.log('   Mot de passe:', password)
    
    console.log('🎯 Vous pouvez maintenant vous connecter avec:')
    console.log('   Email: test@stripe.com')
    console.log('   Mot de passe: password123')
    
    return user
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()

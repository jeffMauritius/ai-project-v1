import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUserDirect() {
  try {
    console.log('👤 Création directe d\'un utilisateur de test...')
    
    const email = 'test@stripe.com'
    const password = 'password123'
    const name = 'Test User'
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Créer l'utilisateur directement sans vérification
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
    
    // Si l'utilisateur existe déjà, on l'affiche
    if (error.code === 'P2002') {
      console.log('ℹ️  L\'utilisateur existe déjà, récupération des informations...')
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: 'test@stripe.com' }
        })
        if (existingUser) {
          console.log('✅ Utilisateur existant trouvé:')
          console.log('   ID:', existingUser.id)
          console.log('   Nom:', existingUser.name)
          console.log('   Email:', existingUser.email)
          console.log('🎯 Vous pouvez vous connecter avec:')
          console.log('   Email: test@stripe.com')
          console.log('   Mot de passe: password123')
        }
      } catch (findError) {
        console.error('❌ Erreur lors de la récupération:', findError)
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

createTestUserDirect()

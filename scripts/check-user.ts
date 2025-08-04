import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser(email: string) {
  try {
    console.log(`🔍 Vérification de l'utilisateur: ${email}`)

    const user = await prisma.user.findUnique({
      where: {
        email: email
      },
      include: {
        storefront: true
      }
    })

    if (!user) {
      console.log(`❌ Utilisateur non trouvé: ${email}`)
      
      // Vérifier tous les utilisateurs avec @temp.com
      const tempUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: '@temp.com'
          }
        }
      })
      
      console.log(`\n📋 Utilisateurs temp trouvés (${tempUsers.length}):`)
      tempUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.name})`)
      })
      
      return
    }

    console.log(`\n✅ Utilisateur trouvé:`)
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   👤 Nom: ${user.name}`)
    console.log(`   🔑 Rôle: ${user.role}`)
    console.log(`   📅 Créé: ${user.createdAt}`)
    
    if (user.storefront) {
      console.log(`   🏢 Vitrine: ${user.storefront.companyName}`)
    } else {
      console.log(`   ❌ Pas de vitrine associée`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Vérifier l'utilisateur pour Château des Bordes
checkUser("67f1f681a1ba35b36ae46137@temp.com") 
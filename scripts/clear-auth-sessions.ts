import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAuthSessions() {
  try {
    console.log('🧹 Nettoyage des sessions NextAuth...')

    // Supprimer toutes les sessions (si vous utilisez l'adaptateur Prisma)
    const deletedSessions = await prisma.session.deleteMany({})
    console.log(`✅ ${deletedSessions.count} sessions supprimées`)

    // Supprimer tous les comptes (si vous utilisez l'adaptateur Prisma)
    const deletedAccounts = await prisma.account.deleteMany({})
    console.log(`✅ ${deletedAccounts.count} comptes supprimés`)

    // Supprimer tous les tokens de vérification (si vous utilisez l'adaptateur Prisma)
    const deletedVerificationTokens = await prisma.verificationToken.deleteMany({})
    console.log(`✅ ${deletedVerificationTokens.count} tokens de vérification supprimés`)

    console.log('🎉 Sessions NextAuth nettoyées avec succès!')
    console.log('💡 Vous devrez vous reconnecter après ce nettoyage.')
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des sessions:', error)
    // Les erreurs peuvent être normales si les tables n'existent pas
    console.log('ℹ️  Cela peut être normal si vous n\'utilisez pas l\'adaptateur Prisma pour NextAuth')
  } finally {
    await prisma.$disconnect()
  }
}

clearAuthSessions()

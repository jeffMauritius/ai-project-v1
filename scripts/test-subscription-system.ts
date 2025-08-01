#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSubscriptionSystem() {
  try {
    console.log('🧪 Test du système d\'abonnement...')

    // 1. Vérifier que les plans existent
    console.log('\n📋 Vérification des plans d\'abonnement...')
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })

    if (plans.length === 0) {
      console.log('❌ Aucun plan trouvé. Exécutez d\'abord le script de configuration.')
      return
    }

    console.log(`✅ ${plans.length} plans trouvés:`)
    plans.forEach(plan => {
      console.log(`   - ${plan.name}: ${plan.price}€/${plan.billingInterval === 'YEARLY' ? 'an' : 'mois'}`)
    })

    // 2. Vérifier qu'il y a au moins un utilisateur partenaire
    console.log('\n👤 Vérification des utilisateurs partenaires...')
    const partnerUsers = await prisma.user.findMany({
      where: { role: 'PARTNER' },
      take: 5
    })

    if (partnerUsers.length === 0) {
      console.log('❌ Aucun utilisateur partenaire trouvé.')
      console.log('💡 Créez d\'abord un compte partenaire pour tester.')
      return
    }

    console.log(`✅ ${partnerUsers.length} utilisateurs partenaires trouvés`)

    // 3. Vérifier les abonnements existants
    console.log('\n🔍 Vérification des abonnements existants...')
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: { select: { email: true } },
        plan: true
      }
    })

    console.log(`📊 ${subscriptions.length} abonnements trouvés:`)
    subscriptions.forEach(sub => {
      console.log(`   - ${sub.user.email}: ${sub.plan.name} (${sub.status})`)
    })

    // 4. Vérifier les informations de facturation
    console.log('\n💳 Vérification des informations de facturation...')
    const billingInfos = await prisma.billingInfo.findMany({
      include: {
        user: { select: { email: true } }
      }
    })

    console.log(`📋 ${billingInfos.length} informations de facturation trouvées`)

    // 5. Vérifier les paiements
    console.log('\n💰 Vérification des paiements...')
    const payments = await prisma.payment.findMany({
      include: {
        subscription: {
          include: {
            user: { select: { email: true } },
            plan: true
          }
        }
      }
    })

    console.log(`💸 ${payments.length} paiements trouvés`)

    // 6. Statistiques générales
    console.log('\n📈 Statistiques du système d\'abonnement:')
    console.log(`   - Plans actifs: ${plans.length}`)
    console.log(`   - Utilisateurs partenaires: ${partnerUsers.length}`)
    console.log(`   - Abonnements actifs: ${subscriptions.filter(s => s.status === 'ACTIVE').length}`)
    console.log(`   - Abonnements en essai: ${subscriptions.filter(s => s.status === 'TRIAL').length}`)
    console.log(`   - Paiements totaux: ${payments.length}`)
    console.log(`   - Montant total facturé: ${payments.reduce((sum, p) => sum + p.amount, 0)}€`)

    // 7. Test de création d'un abonnement (si aucun n'existe)
    if (subscriptions.length === 0 && partnerUsers.length > 0) {
      console.log('\n🧪 Test de création d\'un abonnement...')
      
      const testUser = partnerUsers[0]
      const testPlan = plans.find(p => p.billingInterval === 'MONTHLY')
      
      if (testPlan) {
        const now = new Date()
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

        const newSubscription = await prisma.subscription.create({
          data: {
            userId: testUser.id,
            planId: testPlan.id,
            status: 'TRIAL',
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
            trialStart: now,
            trialEnd: trialEnd
          },
          include: {
            user: { select: { email: true } },
            plan: true
          }
        })

        console.log(`✅ Abonnement créé pour ${newSubscription.user.email}:`)
        console.log(`   - Plan: ${newSubscription.plan.name}`)
        console.log(`   - Statut: ${newSubscription.status}`)
        console.log(`   - Fin d'essai: ${newSubscription.trialEnd?.toLocaleDateString()}`)
      }
    }

    console.log('\n✅ Test du système d\'abonnement terminé avec succès!')
    console.log('\n🎯 Prochaines étapes:')
    console.log('   1. Tester l\'interface utilisateur sur /partner-dashboard/subscription')
    console.log('   2. Vérifier les limites de photos')
    console.log('   3. Tester l\'annulation d\'abonnement')
    console.log('   4. Intégrer Stripe pour les vrais paiements')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testSubscriptionSystem() 
#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupSubscriptionSystem() {
  try {
    console.log('🚀 Configuration du système d\'abonnement...')

    // 1. Générer le client Prisma avec les nouveaux modèles
    console.log('📦 Génération du client Prisma...')
    execSync('npx prisma generate', { stdio: 'inherit' })

    // 2. Pousser les changements de schéma vers la base de données
    console.log('🗄️ Mise à jour de la base de données...')
    execSync('npx prisma db push', { stdio: 'inherit' })

    // 3. Initialiser les plans d'abonnement par défaut
    console.log('📋 Initialisation des plans d\'abonnement...')
    
    const defaultPlans = [
      {
        name: "Essentiel",
        description: "L'essentiel pour démarrer",
        price: 29.00,
        currency: "EUR",
        billingInterval: "MONTHLY" as const,
        features: [
          "Profil professionnel",
          "Messagerie avec les clients",
          "Jusqu'à 10 photos",
          "Statistiques de base",
          "Support par email"
        ],
        isActive: true,
        isPopular: false,
        maxPhotos: 10
      },
      {
        name: "Pro",
        description: "Pour les professionnels établis",
        price: 79.00,
        currency: "EUR",
        billingInterval: "MONTHLY" as const,
        features: [
          "Tout de l'offre Essentiel",
          "Photos illimitées",
          "Mise en avant dans les recherches",
          "Statistiques avancées",
          "Support prioritaire",
          "Accès aux événements premium"
        ],
        isActive: true,
        isPopular: true,
        maxPhotos: null
      },
      {
        name: "Premium",
        description: "Pour une visibilité maximale",
        price: 149.00,
        currency: "EUR",
        billingInterval: "MONTHLY" as const,
        features: [
          "Tout de l'offre Pro",
          "Badge Premium sur votre profil",
          "Accès aux mariages VIP",
          "Accompagnement personnalisé",
          "Formation marketing incluse",
          "Support téléphonique"
        ],
        isActive: true,
        isPopular: false,
        maxPhotos: null
      }
    ]

    // Créer les plans mensuels
    for (const plan of defaultPlans) {
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: {
          name: plan.name,
          billingInterval: plan.billingInterval
        }
      })

      if (existingPlan) {
        console.log(`✅ Plan ${plan.name} (mensuel) existe déjà`)
        await prisma.subscriptionPlan.update({
          where: { id: existingPlan.id },
          data: {
            ...plan,
            updatedAt: new Date()
          }
        })
      } else {
        console.log(`➕ Création du plan ${plan.name} (mensuel)`)
        await prisma.subscriptionPlan.create({
          data: plan
        })
      }
    }

    // Créer les plans annuels avec 20% de réduction
    for (const plan of defaultPlans) {
      const yearlyPrice = Math.round(plan.price * 12 * 0.8) // 20% de réduction sur l'année
      
      const existingYearlyPlan = await prisma.subscriptionPlan.findFirst({
        where: {
          name: plan.name,
          billingInterval: "YEARLY"
        }
      })

      if (existingYearlyPlan) {
        console.log(`✅ Plan ${plan.name} (annuel) existe déjà`)
        await prisma.subscriptionPlan.update({
          where: { id: existingYearlyPlan.id },
          data: {
            ...plan,
            price: yearlyPrice,
            billingInterval: "YEARLY",
            updatedAt: new Date()
          }
        })
      } else {
        console.log(`➕ Création du plan ${plan.name} (annuel)`)
        await prisma.subscriptionPlan.create({
          data: {
            ...plan,
            price: yearlyPrice,
            billingInterval: "YEARLY"
          }
        })
      }
    }

    console.log('✅ Configuration du système d\'abonnement terminée avec succès!')
    console.log('')
    console.log('📋 Plans créés:')
    console.log('   - Essentiel: 29€/mois ou 279€/an')
    console.log('   - Pro: 79€/mois ou 759€/an')
    console.log('   - Premium: 149€/mois ou 1430€/an')
    console.log('')
    console.log('🎯 Prochaines étapes:')
    console.log('   1. Tester la création d\'abonnements')
    console.log('   2. Intégrer Stripe pour les paiements')
    console.log('   3. Configurer les webhooks de paiement')

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
setupSubscriptionSystem() 
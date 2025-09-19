import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSubscriptionPlans() {
  try {
    console.log('🌱 Création des plans d\'abonnement...')

    // Supprimer les plans existants
    await prisma.subscriptionPlan.deleteMany({})
    console.log('✅ Plans existants supprimés')

    // Créer les plans d'abonnement
    const plans = [
      {
        name: 'Gratuit',
        description: 'Pour commencer à planifier',
        price: 0,
        currency: 'EUR',
        billingInterval: 'MONTHLY' as const,
        features: [
          'Recherche de prestataires',
          'Planning de base',
          'Liste d\'invités simple',
          'Messagerie limitée'
        ],
        isActive: true,
        isPopular: false,
        maxPhotos: 10
      },
      {
        name: 'Premium',
        description: 'Pour une organisation complète',
        price: 19.99,
        currency: 'EUR',
        billingInterval: 'MONTHLY' as const,
        features: [
          'Toutes les fonctionnalités gratuites',
          'Assistant IA avancé',
          'Plan de table interactif',
          'Liste de mariage et cagnotte',
          'Messagerie illimitée',
          'Support prioritaire'
        ],
        isActive: true,
        isPopular: true,
        maxPhotos: 100
      },
      {
        name: 'Pro',
        description: 'Pour les professionnels',
        price: 49.99,
        currency: 'EUR',
        billingInterval: 'MONTHLY' as const,
        features: [
          'Toutes les fonctionnalités Premium',
          'Multi-projets',
          'Statistiques avancées',
          'API d\'intégration',
          'Support dédié 24/7',
          'Formation personnalisée'
        ],
        isActive: true,
        isPopular: false,
        maxPhotos: 1000
      },
      {
        name: 'Premium',
        description: 'Pour une organisation complète',
        price: 199.99,
        currency: 'EUR',
        billingInterval: 'YEARLY' as const,
        features: [
          'Toutes les fonctionnalités gratuites',
          'Assistant IA avancé',
          'Plan de table interactif',
          'Liste de mariage et cagnotte',
          'Messagerie illimitée',
          'Support prioritaire',
          'Économisez 20% avec l\'abonnement annuel'
        ],
        isActive: true,
        isPopular: true,
        maxPhotos: 100
      },
      {
        name: 'Pro',
        description: 'Pour les professionnels',
        price: 499.99,
        currency: 'EUR',
        billingInterval: 'YEARLY' as const,
        features: [
          'Toutes les fonctionnalités Premium',
          'Multi-projets',
          'Statistiques avancées',
          'API d\'intégration',
          'Support dédié 24/7',
          'Formation personnalisée',
          'Économisez 20% avec l\'abonnement annuel'
        ],
        isActive: true,
        isPopular: false,
        maxPhotos: 1000
      }
    ]

    for (const plan of plans) {
      await prisma.subscriptionPlan.create({
        data: plan
      })
      console.log(`✅ Plan créé: ${plan.name} (${plan.billingInterval}) - ${plan.price}€`)
    }

    console.log('🎉 Plans d\'abonnement créés avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de la création des plans:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSubscriptionPlans()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    maxPhotos: null // Illimité
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
    maxPhotos: null // Illimité
  }
]

async function initSubscriptionPlans() {
  try {
    console.log('Initialisation des plans d\'abonnement...')

    for (const plan of defaultPlans) {
      // Vérifier si le plan existe déjà
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: {
          name: plan.name,
          billingInterval: plan.billingInterval
        }
      })

      if (existingPlan) {
        console.log(`Plan ${plan.name} existe déjà, mise à jour...`)
        await prisma.subscriptionPlan.update({
          where: { id: existingPlan.id },
          data: {
            ...plan,
            updatedAt: new Date()
          }
        })
      } else {
        console.log(`Création du plan ${plan.name}...`)
        await prisma.subscriptionPlan.create({
          data: plan
        })
      }
    }

    // Créer aussi les versions annuelles avec 20% de réduction
    for (const plan of defaultPlans) {
      const yearlyPrice = Math.round(plan.price * 12 * 0.8) // 20% de réduction sur l'année
      
      const existingYearlyPlan = await prisma.subscriptionPlan.findFirst({
        where: {
          name: plan.name,
          billingInterval: "YEARLY"
        }
      })

      if (existingYearlyPlan) {
        console.log(`Plan annuel ${plan.name} existe déjà, mise à jour...`)
        await prisma.subscriptionPlan.update({
          where: { id: existingYearlyPlan.id },
          data: {
            price: yearlyPrice,
            updatedAt: new Date()
          }
        })
      } else {
        console.log(`Création du plan annuel ${plan.name}...`)
        await prisma.subscriptionPlan.create({
          data: {
            ...plan,
            price: yearlyPrice,
            billingInterval: "YEARLY"
          }
        })
      }
    }

    console.log('Initialisation des plans d\'abonnement terminée avec succès!')
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des plans:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initSubscriptionPlans()
}

export { initSubscriptionPlans } 
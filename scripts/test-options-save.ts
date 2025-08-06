import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testOptionsSave() {
  try {
    console.log('=== Test Options Save ===')
    
    // Récupérer le premier storefront
    const storefront = await prisma.partnerStorefront.findFirst({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!storefront) {
      console.log('Aucun storefront trouvé')
      return
    }
    
    console.log(`Storefront trouvé: ${storefront.companyName} (${storefront.id})`)
    
    // Créer des options de test avec les bons IDs de champs
    const testOptions = {
      "nom": "Salle principale",
      "description": "Une magnifique salle de réception avec vue sur la mer",
      "surface": "375",
      "capacite_assise": "100",
      "capacite_debout": "150",
      "piste_danse": true,
      "acces_pmr": true,
      "acces_exterieur": true,
      "duree_location": "Weekend complet",
      "tarif": "1500",
      "type_hebergement": "Chambres d'hôtes",
      "nombre_chambres": "10",
      "nombre_lits": "20",
      "traiteur_impose": false,
      "propose_restauration": true,
      "boissons_propres": true,
      "droit_bouchon": false,
      "tarif_bouchon": "0",
      "limite_horaire": false,
      "photographe_impose": false,
      "exclusivite_musique": false,
      "services_complementaires": "Accueil, sécurité, ménage",
      "menage_inclus": true,
      "accepte_animaux": true,
      "plusieurs_evenements": false,
      "gardien_securite": true
    }
    
    const testSearchableOptions = {
      "capacite_max": 150,
      "prix_min": 1500,
      "prix_max": 1500,
      "services_disponibles": ["Accueil", "Sécurité", "Ménage"],
      "style": ["Chambres d'hôtes"]
    }
    
    // Mettre à jour le storefront avec les options de test
    const updatedStorefront = await prisma.partnerStorefront.update({
      where: { id: storefront.id },
      data: {
        options: testOptions,
        searchableOptions: testSearchableOptions
      }
    })
    
    console.log('Options sauvegardées avec succès!')
    console.log('Options:', JSON.stringify(updatedStorefront.options, null, 2))
    console.log('SearchableOptions:', JSON.stringify(updatedStorefront.searchableOptions, null, 2))
    
    // Tester l'affichage en simulant la logique de la page storefront
    console.log('\n=== Test Affichage ===')
    
    // Simuler les options de réception venue
    const receptionVenueOptions = {
      lieu_reception: {
        sections: [
          {
            title: "Capacité et tarifs",
            fields: [
              { id: "1", question: "Quelle est votre capacité maximale ?" },
              { id: "2", question: "Proposez-vous un service de traiteur ?" },
              { id: "3", question: "Quels espaces proposez-vous ?" },
              { id: "4", question: "Quel type de cuisine proposez-vous ?" },
              { id: "5", question: "Quel est votre tarif minimum ?" }
            ]
          }
        ]
      }
    }
    
    const serviceOptions = receptionVenueOptions.lieu_reception.sections
    
    console.log('Service options:', serviceOptions)
    
    serviceOptions.forEach((section: any, sectionIndex: number) => {
      console.log(`\nSection ${sectionIndex + 1}: ${section.title}`)
      section.fields.forEach((field: any, fieldIndex: number) => {
        const fieldValue = (testOptions as any)[field.id]
        console.log(`  ${field.question}: ${fieldValue || 'Non renseigné'}`)
      })
    })
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testOptionsSave() 
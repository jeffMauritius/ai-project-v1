import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testStorefrontDisplay() {
  try {
    console.log('=== Test Storefront Display ===')
    
    // Récupérer le storefront avec les options
    const storefront = await prisma.partnerStorefront.findFirst({
      where: {
        options: {
          not: null
        }
      }
    })
    
    if (!storefront) {
      console.log('Aucun storefront avec des options trouvé')
      return
    }
    
    console.log(`Storefront trouvé: ${storefront.companyName} (${storefront.id})`)
    console.log('Options sauvegardées:', JSON.stringify(storefront.options, null, 2))
    
    // Simuler la logique de la page storefront
    const receptionVenueOptions = await import('../partners-options/reception-venue-options.json')
    const serviceOptions = (receptionVenueOptions.default as any).lieu_reception.sections
    
    console.log('\n=== Affichage simulé ===')
    
    serviceOptions.forEach((section: any, sectionIndex: number) => {
      console.log(`\nSection ${sectionIndex + 1}: ${section.title}`)
      section.fields.forEach((field: any, fieldIndex: number) => {
        const optionsData = storefront.options as Record<string, any> || {}
        const fieldValue = optionsData[field.id]
        
        const displayValue = fieldValue !== undefined && fieldValue !== null && fieldValue !== '' 
          ? Array.isArray(fieldValue) 
            ? fieldValue.join(', ')
            : typeof fieldValue === 'boolean'
              ? fieldValue ? 'Oui' : 'Non'
              : String(fieldValue)
          : 'Non renseigné'
        
        console.log(`  ${field.question}: ${displayValue}`)
      })
    })
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStorefrontDisplay() 
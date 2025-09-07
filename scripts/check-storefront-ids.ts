import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStorefrontIds() {
  try {
    console.log('🔍 Vérification de la correspondance des IDs...\n')
    
    // Récupérer tous les storefronts avec leurs relations
    const storefronts = await prisma.partnerStorefront.findMany({
      select: {
        id: true,
        type: true,
        establishmentId: true,
        partnerId: true,
        establishment: {
          select: {
            id: true,
            name: true
          }
        },
        partner: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    })
    
    console.log(`📊 Total des storefronts: ${storefronts.length}\n`)
    
    // Vérifier les correspondances
    let validStorefronts = 0
    let invalidStorefronts = 0
    const issues: string[] = []
    
    for (const storefront of storefronts) {
      if (storefront.type === 'VENUE') {
        if (storefront.establishmentId && storefront.establishment) {
          if (storefront.establishmentId === storefront.establishment.id) {
            validStorefronts++
          } else {
            invalidStorefronts++
            issues.push(`❌ Storefront ${storefront.id} (VENUE): establishmentId ${storefront.establishmentId} ≠ establishment.id ${storefront.establishment.id}`)
          }
        } else {
          invalidStorefronts++
          issues.push(`❌ Storefront ${storefront.id} (VENUE): establishmentId ${storefront.establishmentId} mais pas d'établissement lié`)
        }
      } else if (storefront.type === 'PARTNER') {
        if (storefront.partnerId && storefront.partner) {
          if (storefront.partnerId === storefront.partner.id) {
            validStorefronts++
          } else {
            invalidStorefronts++
            issues.push(`❌ Storefront ${storefront.id} (PARTNER): partnerId ${storefront.partnerId} ≠ partner.id ${storefront.partner.id}`)
          }
        } else {
          invalidStorefronts++
          issues.push(`❌ Storefront ${storefront.id} (PARTNER): partnerId ${storefront.partnerId} mais pas de partenaire lié`)
        }
      }
    }
    
    console.log(`✅ Storefronts valides: ${validStorefronts}`)
    console.log(`❌ Storefronts invalides: ${invalidStorefronts}\n`)
    
    if (issues.length > 0) {
      console.log('🚨 Problèmes détectés:')
      issues.slice(0, 10).forEach(issue => console.log(issue))
      if (issues.length > 10) {
        console.log(`... et ${issues.length - 10} autres problèmes`)
      }
    }
    
    // Vérifier les establishments sans storefront
    const establishmentsWithoutStorefront = await prisma.establishment.findMany({
      where: {
        storefronts: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true
      }
    })
    
    console.log(`\n📋 Establishments sans storefront: ${establishmentsWithoutStorefront.length}`)
    if (establishmentsWithoutStorefront.length > 0) {
      console.log('Premiers établissements sans storefront:')
      establishmentsWithoutStorefront.slice(0, 5).forEach(est => {
        console.log(`  - ${est.id}: ${est.name}`)
      })
    }
    
    // Vérifier les partners sans storefront
    const partnersWithoutStorefront = await prisma.partner.findMany({
      where: {
        storefronts: {
          none: {}
        }
      },
      select: {
        id: true,
        companyName: true
      }
    })
    
    console.log(`\n📋 Partners sans storefront: ${partnersWithoutStorefront.length}`)
    if (partnersWithoutStorefront.length > 0) {
      console.log('Premiers partenaires sans storefront:')
      partnersWithoutStorefront.slice(0, 5).forEach(partner => {
        console.log(`  - ${partner.id}: ${partner.companyName}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStorefrontIds()

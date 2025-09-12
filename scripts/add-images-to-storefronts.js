const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function addImagesToStorefronts() {
  console.log('🖼️ Ajout des images aux storefronts existants...')
  
  // 1. Mettre à jour les storefronts des établissements
  console.log('📁 Mise à jour des storefronts d\'établissements...')
  
  const establishments = await prisma.establishment.findMany({
    where: {
      images: {
        not: {
          equals: []
        }
      }
    },
    select: {
      id: true,
      name: true,
      images: true
    }
  })
  
  console.log(`📊 ${establishments.length} établissements avec images trouvés`)
  
  for (const establishment of establishments) {
    try {
      await prisma.partnerStorefront.updateMany({
        where: {
          establishmentId: establishment.id
        },
        data: {
          images: establishment.images,
          logo: establishment.images[0] || null
        }
      })
      console.log(`✅ ${establishment.name} - ${establishment.images.length} images ajoutées`)
    } catch (error) {
      console.error(`❌ Erreur pour ${establishment.name}:`, error.message)
    }
  }
  
  // 2. Mettre à jour les storefronts des partenaires
  console.log('📁 Mise à jour des storefronts de partenaires...')
  
  const partners = await prisma.partner.findMany({
    where: {
      images: {
        not: {
          equals: []
        }
      }
    },
    select: {
      id: true,
      companyName: true,
      images: true
    }
  })
  
  console.log(`📊 ${partners.length} partenaires avec images trouvés`)
  
  for (const partner of partners) {
    try {
      await prisma.partnerStorefront.updateMany({
        where: {
          partnerId: partner.id
        },
        data: {
          images: partner.images,
          logo: partner.images[0] || null
        }
      })
      console.log(`✅ ${partner.companyName} - ${partner.images.length} images ajoutées`)
    } catch (error) {
      console.error(`❌ Erreur pour ${partner.companyName}:`, error.message)
    }
  }
  
  console.log('🎉 Images ajoutées aux storefronts avec succès!')
}

async function main() {
  try {
    await addImagesToStorefronts()
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()




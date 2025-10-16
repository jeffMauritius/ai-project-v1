import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findStorefrontData(id: string) {
  try {
    console.log(`🔍 Recherche des données pour l'ID: ${id}`)

    // 1. Chercher dans PartnerStorefront
    console.log(`\n1️⃣ Recherche dans PartnerStorefront...`)
    let storefront = await prisma.partnerStorefront.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        isActive: true,
        images: true,
        media: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            url: true,
            type: true,
            title: true,
            order: true
          }
        },
        establishment: {
          select: {
            id: true,
            name: true,
            images: true
          }
        },
        partner: {
          select: {
            id: true,
            companyName: true,
            images: true
          }
        }
      }
    })

    if (storefront) {
      console.log(`✅ Trouvé dans PartnerStorefront:`)
      console.log(`   ID: ${storefront.id}`)
      console.log(`   Type: ${storefront.type}`)
      console.log(`   Actif: ${storefront.isActive}`)
      console.log(`   Images storefront: ${storefront.images?.length || 0}`)
      console.log(`   Médias: ${storefront.media?.length || 0}`)
      console.log(`   Partenaire: ${storefront.partner?.companyName}`)
      console.log(`   Images partenaire: ${storefront.partner?.images?.length || 0}`)
      console.log(`   Établissement: ${storefront.establishment?.name}`)
      console.log(`   Images établissement: ${storefront.establishment?.images?.length || 0}`)

      // Analyser toutes les images
      const allImages = [
        ...(storefront.images || []),
        ...(storefront.media?.map(m => m.url) || []),
        ...(storefront.partner?.images || []),
        ...(storefront.establishment?.images || [])
      ]

      console.log(`\n📸 ANALYSE DES IMAGES:`)
      console.log(`======================`)
      console.log(`Total images: ${allImages.length}`)

      const vercelUrls = allImages.filter(url => url.includes('vercel-storage.com'))
      const mariagesUrls = allImages.filter(url => url.includes('mariages.net'))
      const otherUrls = allImages.filter(url => !url.includes('vercel-storage.com') && !url.includes('mariages.net'))

      console.log(`URLs Vercel Blob: ${vercelUrls.length}`)
      console.log(`URLs Mariages.net: ${mariagesUrls.length}`)
      console.log(`Autres URLs: ${otherUrls.length}`)

      if (vercelUrls.length > 0) {
        console.log(`\n✅ URLs VERCEL BLOB:`)
        vercelUrls.forEach((url, index) => {
          console.log(`${index + 1}. ${url}`)
        })
      }

      return { type: 'storefront', data: storefront }
    }

    // 2. Chercher dans Establishment
    console.log(`\n2️⃣ Recherche dans Establishment...`)
    const establishment = await prisma.establishment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        region: true,
        images: true
      }
    })

    if (establishment) {
      console.log(`✅ Trouvé dans Establishment:`)
      console.log(`   ID: ${establishment.id}`)
      console.log(`   Nom: ${establishment.name}`)
      console.log(`   Ville: ${establishment.city}`)
      console.log(`   Région: ${establishment.region}`)
      console.log(`   Images: ${establishment.images?.length || 0}`)

      if (establishment.images && establishment.images.length > 0) {
        console.log(`\n📸 IMAGES DE L'ÉTABLISSEMENT:`)
        establishment.images.forEach((url, index) => {
          console.log(`${index + 1}. ${url}`)
        })

        const vercelUrls = establishment.images.filter(url => url.includes('vercel-storage.com'))
        const mariagesUrls = establishment.images.filter(url => url.includes('mariages.net'))

        console.log(`\n🔗 ANALYSE DES URLs:`)
        console.log(`URLs Vercel Blob: ${vercelUrls.length}`)
        console.log(`URLs Mariages.net: ${mariagesUrls.length}`)
      }

      return { type: 'establishment', data: establishment }
    }

    // 3. Chercher dans Partner
    console.log(`\n3️⃣ Recherche dans Partner...`)
    const partner = await prisma.partner.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        images: true
      }
    })

    if (partner) {
      console.log(`✅ Trouvé dans Partner:`)
      console.log(`   ID: ${partner.id}`)
      console.log(`   Nom: ${partner.companyName}`)
      console.log(`   Service: ${partner.serviceType}`)
      console.log(`   Images: ${partner.images?.length || 0}`)

      if (partner.images && partner.images.length > 0) {
        console.log(`\n📸 IMAGES DU PARTENAIRE:`)
        partner.images.forEach((url, index) => {
          console.log(`${index + 1}. ${url}`)
        })
      }

      return { type: 'partner', data: partner }
    }

    console.log(`❌ Entité non trouvée dans aucune table`)
    return null

  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

// Utiliser l'ID depuis l'URL
const entityId = '68bfa7178ee56a699c75b0fc'
findStorefrontData(entityId).catch(console.error)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPartnerStorefrontTable() {
  try {
    console.log(`🔍 Vérification de la table PartnerStorefront`)

    // Chercher avec l'ID exact
    const exactStorefront = await prisma.partnerStorefront.findUnique({
      where: { id: '68bfa7178ee56a699c75b0fc' },
      select: {
        id: true,
        partnerId: true,
        type: true,
        isActive: true,
        media: {
          select: {
            id: true,
            url: true,
            type: true,
            title: true,
            order: true
          },
          orderBy: {
            order: 'asc'
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

    if (exactStorefront) {
      console.log(`✅ Storefront trouvé:`)
      console.log(`   ID: ${exactStorefront.id}`)
      console.log(`   Partner ID: ${exactStorefront.partnerId}`)
      console.log(`   Type: ${exactStorefront.type}`)
      console.log(`   Actif: ${exactStorefront.isActive}`)
      console.log(`   Partenaire: ${exactStorefront.partner?.companyName}`)
      console.log(`   Médias: ${exactStorefront.media?.length || 0}`)
      console.log(`   Images partner: ${exactStorefront.partner?.images?.length || 0}`)

      if (exactStorefront.media && exactStorefront.media.length > 0) {
        console.log(`\n📸 MÉDIAS DANS STOREFRONT:`)
        exactStorefront.media.forEach((media, index) => {
          console.log(`${index + 1}. [${media.type}] ${media.url}`)
          console.log(`   Titre: ${media.title || 'N/A'}`)
          console.log(`   Ordre: ${media.order}`)
        })
      }

      if (exactStorefront.partner?.images && exactStorefront.partner.images.length > 0) {
        console.log(`\n📸 IMAGES DANS PARTNER:`)
        exactStorefront.partner.images.forEach((url, index) => {
          console.log(`${index + 1}. ${url}`)
        })
      }

      // Analyser les URLs
      const allUrls = [
        ...(exactStorefront.partner?.images || []),
        ...(exactStorefront.media?.map(m => m.url) || [])
      ]

      const vercelUrls = allUrls.filter(url => url.includes('vercel-storage.com'))
      const mariagesUrls = allUrls.filter(url => url.includes('mariages.net'))
      const otherUrls = allUrls.filter(url => !url.includes('vercel-storage.com') && !url.includes('mariages.net'))

      console.log(`\n🔗 ANALYSE DES URLs:`)
      console.log(`===================`)
      console.log(`URLs Vercel Blob: ${vercelUrls.length}`)
      console.log(`URLs Mariages.net: ${mariagesUrls.length}`)
      console.log(`Autres URLs: ${otherUrls.length}`)

      if (vercelUrls.length > 0) {
        console.log(`\n✅ URLs VERCEL BLOB:`)
        vercelUrls.forEach((url, index) => {
          console.log(`${index + 1}. ${url}`)
        })
      }

      if (mariagesUrls.length > 0) {
        console.log(`\n⚠️ URLs MARIAGES.NET:`)
        mariagesUrls.forEach((url, index) => {
          console.log(`${index + 1}. ${url}`)
        })
      }

    } else {
      console.log(`❌ Storefront non trouvé`)

      // Compter le total des storefronts
      const totalCount = await prisma.partnerStorefront.count()
      console.log(`📊 Total des storefronts dans la table: ${totalCount}`)

      // Chercher quelques storefronts récents
      const recentStorefronts = await prisma.partnerStorefront.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          partnerId: true,
          type: true,
          partner: {
            select: {
              companyName: true
            }
          }
        }
      })

      console.log(`\n📋 Derniers storefronts créés:`)
      recentStorefronts.forEach((storefront, index) => {
        console.log(`${index + 1}. ${storefront.id} - ${storefront.partner?.companyName}`)
      })
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPartnerStorefrontTable().catch(console.error)
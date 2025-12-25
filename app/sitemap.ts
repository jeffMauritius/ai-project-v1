import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://monmariage.ai'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/establishments`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/prestataires`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Pages dynamiques - Storefronts actifs
  let storefrontPages: MetadataRoute.Sitemap = []

  try {
    const storefronts = await prisma.partnerStorefront.findMany({
      where: { isActive: true },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    storefrontPages = storefronts.map((storefront) => ({
      url: `${BASE_URL}/storefront/${storefront.id}`,
      lastModified: storefront.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error)
  }

  return [...staticPages, ...storefrontPages]
}

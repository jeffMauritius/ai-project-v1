import './globals.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { GalleryProvider } from '@/components/ui/GlobalImageGallery'
import { ConfirmationProvider } from '@/components/ui/confirmation-dialog'
import { FavoritesProvider } from '@/hooks/useFavorites'
import { SidebarProvider } from './contexts/SidebarContext'
import { headers } from 'next/headers'

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://monmariage.ai'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'MonMariage.ai - Organisez votre mariage avec l\'IA',
    template: '%s | MonMariage.ai'
  },
  description: 'Trouvez les meilleurs prestataires et lieux de réception pour votre mariage en France. Planification intelligente assistée par IA, comparaison de devis et organisation simplifiée.',
  keywords: [
    'mariage',
    'wedding planner',
    'lieu de réception mariage',
    'prestataires mariage',
    'organisation mariage',
    'salle de mariage',
    'traiteur mariage',
    'photographe mariage',
    'DJ mariage',
    'décoration mariage',
    'France'
  ],
  authors: [{ name: 'MonMariage.ai', url: BASE_URL }],
  creator: 'MonMariage.ai',
  publisher: 'MonMariage.ai',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/monmariage-logo.png',
    shortcut: '/monmariage-logo.png',
    apple: '/monmariage-logo.png',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'MonMariage.ai',
    title: 'MonMariage.ai - Organisez votre mariage avec l\'IA',
    description: 'Trouvez les meilleurs prestataires et lieux de réception pour votre mariage en France.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MonMariage.ai - Plateforme de planification de mariage',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MonMariage.ai - Organisez votre mariage avec l\'IA',
    description: 'Trouvez les meilleurs prestataires et lieux de réception pour votre mariage en France.',
    images: ['/og-image.jpg'],
    creator: '@monmariage_ai',
    site: '@monmariage_ai',
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'fr-FR': BASE_URL,
    },
  },
  category: 'wedding',
  classification: 'Wedding Planning',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAuthPage = pathname.startsWith("/auth/");

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {/* JSON-LD Schema Organisation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'MonMariage.ai',
              url: BASE_URL,
              logo: `${BASE_URL}/monmariage-logo.png`,
              description: 'Plateforme de planification de mariage assistée par intelligence artificielle',
              foundingDate: '2024',
              sameAs: [
                'https://www.instagram.com/monmariage.ai',
                'https://www.facebook.com/monmariage.ai',
                'https://twitter.com/monmariage_ai'
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                email: 'contact@monmariage.ai',
                availableLanguage: ['French']
              },
              areaServed: {
                '@type': 'Country',
                name: 'France'
              },
              serviceType: 'Wedding Planning Platform'
            })
          }}
        />
        <Providers>
          <ConfirmationProvider>
            <GalleryProvider>
              <FavoritesProvider>
                <SidebarProvider>
                  {!isAuthPage && <Navbar />}
                  {children}
                  {!isAuthPage && <Footer />}
                </SidebarProvider>
              </FavoritesProvider>
            </GalleryProvider>
          </ConfirmationProvider>
        </Providers>
      </body>
    </html>
  )
}

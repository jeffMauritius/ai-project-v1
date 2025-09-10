import './globals.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { GalleryProvider } from '@/components/ui/GlobalImageGallery'
import { ConfirmationProvider } from '@/components/ui/confirmation-dialog'
import { headers } from 'next/headers'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Project',
  description: 'Application de gestion de mariage',
  icons: {
    icon: 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/heart.svg'
  }
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
        <Providers>
          <ConfirmationProvider>
            <GalleryProvider>
              {!isAuthPage && <Navbar />}
              {children}
              {!isAuthPage && <Footer />}
            </GalleryProvider>
          </ConfirmationProvider>
        </Providers>
      </body>
    </html>
  )
}

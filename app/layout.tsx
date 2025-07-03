import './globals.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
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
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {!isAuthPage && <Navbar />}
          {children}
          {!isAuthPage && <Footer />}
        </Providers>
      </body>
    </html>
  )
}
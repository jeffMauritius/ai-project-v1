import './globals.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Project',
  description: 'Application de gestion de mariage',
  icons: {
    icon: 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/heart.svg'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
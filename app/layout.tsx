import './globals.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getSession } from '@/lib/auth';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mon Mariage AI - Planificateur de Mariage Intelligent',
  description: 'Planifiez le mariage de vos rêves avec l\'aide de l\'intelligence artificielle',
  icons: {
    icon: 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/heart.svg'
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-900`} suppressHydrationWarning>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
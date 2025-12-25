import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lieux de réception pour mariage',
  description: 'Découvrez notre sélection de lieux de réception pour votre mariage en France : châteaux, domaines, hôtels, salles de réception, jardins et espaces atypiques. Comparez les capacités, tarifs et disponibilités.',
  keywords: [
    'lieu réception mariage',
    'salle de mariage',
    'château mariage',
    'domaine mariage',
    'espace réception',
    'mariage France'
  ],
  openGraph: {
    title: 'Lieux de réception pour mariage | MonMariage.ai',
    description: 'Découvrez notre sélection de lieux de réception pour votre mariage en France.',
    url: '/establishments',
    type: 'website',
  },
  alternates: {
    canonical: '/establishments',
  },
}

export default function EstablishmentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

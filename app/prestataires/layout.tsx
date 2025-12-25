import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prestataires de mariage',
  description: 'Trouvez les meilleurs prestataires pour votre mariage en France : photographes, traiteurs, DJ, fleuristes, décorateurs, wedding planners et plus encore. Comparez les avis et demandez des devis gratuits.',
  keywords: [
    'prestataires mariage',
    'photographe mariage',
    'traiteur mariage',
    'DJ mariage',
    'fleuriste mariage',
    'décorateur mariage',
    'wedding planner'
  ],
  openGraph: {
    title: 'Prestataires de mariage | MonMariage.ai',
    description: 'Trouvez les meilleurs prestataires pour votre mariage en France.',
    url: '/prestataires',
    type: 'website',
  },
  alternates: {
    canonical: '/prestataires',
  },
}

export default function PrestatairesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

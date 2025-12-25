import { Metadata } from 'next'
import PartnerDashboardLayoutClient from './PartnerDashboardLayoutClient'

export const metadata: Metadata = {
  title: 'Espace Partenaire - MonMariage.ai',
  description: 'Gérez votre activité et vos prestations de mariage',
}

export default function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PartnerDashboardLayoutClient>{children}</PartnerDashboardLayoutClient>
}

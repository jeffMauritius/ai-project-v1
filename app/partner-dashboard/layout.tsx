import { Metadata } from 'next'
import Navbar from '../components/Navbar'
import PartnerSidebar from './components/PartnerSidebar'

export const metadata: Metadata = {
  title: 'Espace Partenaire - MonMariage.ai',
  description: 'Gérez votre activité et vos prestations de mariage',
}

export default function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          <PartnerSidebar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
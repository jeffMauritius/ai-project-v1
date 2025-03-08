import { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

export const metadata: Metadata = {
  title: 'Tableau de bord - MonMariage.ai',
  description: 'Gérez votre mariage et accédez à vos informations personnelles',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
'use client'

import PartnerSidebar from './components/PartnerSidebar'

interface PartnerDashboardLayoutClientProps {
  children: React.ReactNode
}

export default function PartnerDashboardLayoutClient({ children }: PartnerDashboardLayoutClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <PartnerSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import PartnerSidebar from './components/PartnerSidebar'
import Navbar from '../components/Navbar'

interface PartnerDashboardLayoutClientProps {
  children: React.ReactNode
}

export default function PartnerDashboardLayoutClient({ children }: PartnerDashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Navbar
        showMenuButton={true}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          <PartnerSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 p-4 md:p-6 lg:p-8 w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

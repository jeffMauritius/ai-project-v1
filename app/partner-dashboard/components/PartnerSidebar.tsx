'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { BarChart3, CreditCard, MessageSquare, Star, Settings, Store, Users2, Inbox, LineChart, X } from 'lucide-react'

const navigation = [
  { name: 'Tableau de bord', href: '/partner-dashboard', icon: BarChart3 },
  { name: 'Abonnement', href: '/partner-dashboard/subscription', icon: CreditCard },
  { name: 'Avis clients', href: '/partner-dashboard/reviews', icon: Star },
  { name: 'Messages', href: '/partner-dashboard/messages', icon: MessageSquare },
  { name: 'Leads', href: '/partner-dashboard/leads', icon: Inbox },
  { name: 'Statistiques', href: '/partner-dashboard/analytics', icon: LineChart },
  { name: 'Nos Partenaires', href: '/partner-dashboard/partners', icon: Users2 },
  { name: 'Ma vitrine', href: '/partner-dashboard/storefront', icon: Store },
  { name: 'Paramètres', href: '/partner-dashboard/settings', icon: Settings },
]

interface PartnerSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function PartnerSidebar({ isOpen = false, onClose }: PartnerSidebarProps) {
  const pathname = usePathname()

  // Fermer le sidebar quand on change de page sur mobile
  useEffect(() => {
    if (onClose) {
      onClose()
    }
  }, [pathname])

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 md:top-16 left-0 z-50 md:z-auto
        w-64 bg-white dark:bg-gray-800 h-screen
        border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header mobile avec bouton fermer */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
          <span className="font-semibold text-gray-900 dark:text-white">Menu Partenaire</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-65px)] md:h-[calc(100vh-64px)]">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
                key={item.name}
              >
                <Link href={item.href} className="flex items-center">
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {item.name}
                </Link>
              </Button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

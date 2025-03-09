'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { BarChart3, CreditCard, MessageSquare, Star, Settings, Store, Users2, Inbox, LineChart } from 'lucide-react'

const navigation = [
  { name: 'Tableau de bord', href: '/partner-dashboard', icon: BarChart3 },
  { name: 'Abonnement', href: '/partner-dashboard/subscription', icon: CreditCard },
  { name: 'Avis clients', href: '/partner-dashboard/reviews', icon: Star },
  { name: 'Messages', href: '/partner-dashboard/messages', icon: MessageSquare },
  { name: 'Leads', href: '/partner-dashboard/leads', icon: Inbox },
  { name: 'Statistiques', href: '/partner-dashboard/analytics', icon: LineChart },
  { name: 'Partenaires recommandés', href: '/partner-dashboard/partners', icon: Users2 },
  { name: 'Ma vitrine', href: '/partner-dashboard/storefront', icon: Store },
  { name: 'Paramètres', href: '/partner-dashboard/settings', icon: Settings },
]

export default function PartnerSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 h-screen sticky top-16 border-r border-gray-200 dark:border-gray-700">
      <nav className="p-4 space-y-2">
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
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
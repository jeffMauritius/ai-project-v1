'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBarIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  InboxIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Tableau de bord', href: '/partner-dashboard', icon: ChartBarIcon },
  { name: 'Abonnement', href: '/partner-dashboard/subscription', icon: CreditCardIcon },
  { name: 'Avis clients', href: '/partner-dashboard/reviews', icon: StarIcon },
  { name: 'Messages', href: '/partner-dashboard/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Leads', href: '/partner-dashboard/leads', icon: InboxIcon },
  { name: 'Partenaires recommandés', href: '/partner-dashboard/partners', icon: UsersIcon },
  { name: 'Ma vitrine', href: '/partner-dashboard/storefront', icon: BuildingStorefrontIcon },
  { name: 'Paramètres', href: '/partner-dashboard/settings', icon: Cog6ToothIcon },
]

export default function PartnerSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white dark:bg-gray-800 h-screen sticky top-16 border-r border-gray-200 dark:border-gray-700">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
        <Link
          href="/partner/1"
          className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 transition-colors mt-2"
        >
          <BuildingStorefrontIcon className="h-5 w-5 mr-3" />
          Visualiser ma vitrine
        </Link>
      </nav>
    </div>
  )
}
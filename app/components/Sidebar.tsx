'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  UserCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  TableCellsIcon,
  PhotoIcon,
  UsersIcon,
  CalendarDaysIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Paramètres', href: '/dashboard/settings', icon: UserCircleIcon },
  { name: 'Organisation', href: '/dashboard/planning', icon: CalendarDaysIcon },
  { name: 'Historique des recherches', href: '/dashboard/search-history', icon: ClockIcon },
  { name: 'Mes favoris', href: '/dashboard/favorites', icon: HeartIcon },
  { name: 'Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Invités', href: '/dashboard/guests', icon: UsersIcon },
  { name: 'Plan de table', href: '/dashboard/seating', icon: TableCellsIcon },
  { name: 'Photos', href: '/dashboard/photos', icon: PhotoIcon },
]

export default function Sidebar() {
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
      </nav>
    </div>
  )
}
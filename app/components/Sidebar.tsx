'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  UserCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  TableCellsIcon,
  PhotoIcon,
  UsersIcon,
  CalendarDaysIcon,
  HeartIcon,
  XMarkIcon
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

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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
      <div className={`
        fixed md:sticky top-0 md:top-16 left-0 z-50 md:z-auto
        w-64 bg-white dark:bg-gray-800 h-screen
        border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header mobile avec bouton fermer */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
          <span className="font-semibold text-gray-900 dark:text-white">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-65px)] md:h-[calc(100vh-64px)]">
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
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}

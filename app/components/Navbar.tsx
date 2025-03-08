'use client'

import Link from 'next/link'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import ThemeToggle from './ThemeToggle'
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <span className="text-2xl font-semibold text-pink-600 dark:text-pink-400">MonMariage.ai</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/partner-dashboard"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Tableau de bord partenaire"
            >
              <BuildingStorefrontIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard/settings"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Paramètres"
            >
              <UserCircleIcon className="h-5 w-5" />
            </Link>
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
            >
              Connexion
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
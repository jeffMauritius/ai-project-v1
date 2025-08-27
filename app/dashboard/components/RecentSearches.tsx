'use client'

import { ClockIcon, MapPinIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import Link from 'next/link'

export default function RecentSearches() {
  const { searchHistory, loading } = useSearchHistory()

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recherches récentes
        </h3>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
        </div>
      </div>
    )
  }

  const recentSearches = searchHistory.slice(0, 3)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recherches récentes
        </h3>
        <Link 
          href="/dashboard/search-history"
          className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
        >
          Voir tout
        </Link>
      </div>

      {recentSearches.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune recherche récente
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentSearches.map((search) => (
            <div key={search.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex-shrink-0">
                <span className="h-6 w-6 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                  {search.type === 'Lieu' ? (
                    <MapPinIcon className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                  ) : (
                    <BuildingStorefrontIcon className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                  )}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {search.query}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {search.results.length} résultat(s) • {new Date(search.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
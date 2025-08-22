'use client'

import { ClockIcon, MapPinIcon, BuildingStorefrontIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { SearchResultStatus } from '@/components/ui/SearchResultStatus'
import { useSearchHistory } from '@/hooks/useSearchHistory'

export default function SearchHistory() {
  const { searchHistory, loading, deletingId, deleteSearch } = useSearchHistory()

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Historique des recherches</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Historique des recherches</h1>
      
      {searchHistory.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune recherche</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vos recherches apparaîtront ici une fois que vous commencerez à utiliser la recherche.
          </p>
        </div>
      ) : (
      
              <div className="flow-root">
          <ul role="list" className="-mb-8">
            {searchHistory.map((event, eventIdx) => (
              <li key={event.id}>
                <div className="relative pb-8">
                  {eventIdx !== searchHistory.length - 1 ? (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-900">
                        {event.type === 'Lieu' ? (
                          <MapPinIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        ) : (
                          <BuildingStorefrontIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        )}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{event.query}</p>
                        <div className="mt-2 space-y-2">
                          {event.results.map((result, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center text-gray-500 dark:text-gray-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-pink-600 dark:bg-pink-400 mr-2" />
                                {result.name}
                              </div>
                              <SearchResultStatus status={result.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={event.date}>
                            <ClockIcon className="inline-block h-4 w-4 mr-1" />
                            {new Date(event.date).toLocaleDateString()}
                          </time>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSearch(event.id)}
                          disabled={deletingId === event.id}
                          className="text-gray-400 hover:text-red-500"
                        >
                          {deletingId === event.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
'use client'

import { ClockIcon, MapPinIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'

const searchHistory = [
  {
    id: 1,
    date: '2024-01-15',
    type: 'Lieu',
    query: 'Château avec jardin près de Paris',
    results: [
      { name: 'Château de Vaux-le-Vicomte', status: 'Contacté' },
      { name: 'Château de Fontainebleau', status: 'Sauvegardé' }
    ]
  },
  {
    id: 2,
    date: '2024-01-14',
    type: 'Prestataire',
    query: 'Photographe style reportage',
    results: [
      { name: 'Studio Lumière', status: 'Rendez-vous prévu' },
      { name: 'Capture Moments', status: 'Sauvegardé' }
    ]
  }
]

export default function SearchHistory() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Historique des recherches</h1>
      
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
                            className="flex items-center text-sm text-gray-500 dark:text-gray-400"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-pink-600 dark:bg-pink-400 mr-2" />
                            {result.name}
                            <span className="mx-2">•</span>
                            {result.status}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      <time dateTime={event.date}>
                        <ClockIcon className="inline-block h-4 w-4 mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
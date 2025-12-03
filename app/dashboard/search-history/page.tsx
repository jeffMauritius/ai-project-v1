'use client'

import { useEffect } from 'react'
import { ClockIcon, MapPinIcon, BuildingStorefrontIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { SearchResultStatus } from '@/components/ui/SearchResultStatus'
import { useConsultedStorefronts } from '@/hooks/useConsultedStorefronts'
import { useRouter } from 'next/navigation'

export default function ConsultedStorefronts() {
  const { consultedStorefronts, loading, deleteConsultation, refreshList } = useConsultedStorefronts()
  const router = useRouter()



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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historique des recherches</h1>
        <Button 
          onClick={refreshList}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ClockIcon className="h-4 w-4" />
          Rafraîchir
        </Button>
      </div>
      
      {consultedStorefronts.length === 0 ? (
        <div className="text-center py-12">
          <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune vitrine consultée</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Les vitrines que vous consultez apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {consultedStorefronts.map((storefront, storefrontIdx) => (
              <li key={storefront.id}>
                <div className="relative pb-8">
                  {storefrontIdx !== consultedStorefronts.length - 1 ? (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-900">
                        {storefront.type === 'VENUE' ? (
                          <MapPinIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        ) : (
                          <BuildingStorefrontIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        )}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{storefront.name}</p>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                            {storefront.type === 'VENUE' ? 'Lieu' : storefront.serviceType || 'Prestataire'}
                          </span>
                          <SearchResultStatus status={storefront.status} />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={storefront.updatedAt}>
                            <ClockIcon className="inline-block h-4 w-4 mr-1" />
                            {new Date(storefront.updatedAt).toLocaleDateString()}
                          </time>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Rediriger vers la vitrine (même route pour VENUE et PARTNER)
                              router.push(`/storefront/${storefront.storefrontId}`)
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteConsultation(storefront.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
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
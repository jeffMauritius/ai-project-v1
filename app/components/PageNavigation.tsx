'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function PageNavigation() {
  const router = useRouter()

  return (
    <div className="fixed inset-y-0 left-4 right-4 z-10 pointer-events-none">
      <div className="h-full flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors pointer-events-auto"
          aria-label="Page précédente"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          onClick={() => router.forward()}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors pointer-events-auto"
          aria-label="Page suivante"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
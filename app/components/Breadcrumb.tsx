'use client'

import { HomeIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

type BreadcrumbItem = {
  name: string
  href: string
  current: boolean
}

const pageTitles: Record<string, string> = {
  results: 'Résultats',
  venue: 'Lieu',
  partner: 'Partenaire',
  product: 'Produit',
  features: 'Fonctionnalités',
  pricing: 'Tarifs',
  testimonials: 'Témoignages',
  guide: 'Guide',
  company: 'Entreprise',
  about: 'À propos',
  blog: 'Blog',
  jobs: 'Emplois',
  press: 'Presse',
  legal: 'Légal',
  terms: 'Conditions',
  privacy: 'Confidentialité',
  cookies: 'Cookies'
}

export default function Breadcrumb() {
  const pathname = usePathname()
  
  if (pathname === '/') return null
  
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Accueil', href: '/', current: false },
    ...segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`
      const name = pageTitles[segment] || segment
      return {
        name,
        href,
        current: index === segments.length - 1
      }
    })
  ]

  return (
    <nav className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-16 z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center">
          <ol role="list" className="flex items-center space-x-2">
            {breadcrumbs.map((item, index) => (
              <li key={item.href} className="flex items-center">
                {index === 0 ? (
                  <Link
                    href={item.href}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span className="sr-only">{item.name}</span>
                  </Link>
                ) : (
                  <>
                    <ChevronRightIcon
                      className="h-5 w-5 flex-shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    <Link
                      href={item.href}
                      className={`ml-2 text-sm font-medium ${
                        item.current
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </nav>
  )
}
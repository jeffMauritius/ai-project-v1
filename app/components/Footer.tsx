'use client'

import { HeartIcon } from '@heroicons/react/24/solid'

const footerLinks = {
  product: [
    { name: 'Fonctionnalités', href: '/product/features' },
    { name: 'Tarifs', href: '/product/pricing' },
    { name: 'Témoignages', href: '/product/testimonials' },
    { name: 'Guide', href: '/product/guide' },
  ],
  company: [
    { name: 'À propos', href: '/company/about' },
    { name: 'Blog', href: '/company/blog' },
    { name: 'Emplois', href: '/company/jobs' },
    { name: 'Presse', href: '/company/press' },
  ],
  legal: [
    { name: 'Conditions', href: '/legal/terms' },
    { name: 'Confidentialité', href: '/legal/privacy' },
    { name: 'Cookies', href: '/legal/cookies' },
  ],
  social: [
    { name: 'Instagram', href: '#' },
    { name: 'Pinterest', href: '#' },
    { name: 'Facebook', href: '#' },
    { name: 'Twitter', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <span className="text-2xl font-semibold text-pink-600 dark:text-pink-400">MonMariage.ai</span>
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
              Planifiez le mariage de vos rêves avec l&apos;aide de l&apos;intelligence artificielle.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">Produit</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerLinks.product.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm leading-6 text-gray-600 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">Entreprise</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerLinks.company.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm leading-6 text-gray-600 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">Légal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerLinks.legal.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm leading-6 text-gray-600 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">Social</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerLinks.social.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm leading-6 text-gray-600 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-900/10 dark:border-gray-700 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            Fait avec <HeartIcon className="h-3 w-3 text-pink-500" /> en France &copy; {new Date().getFullYear()} MonMariage.ai
          </p>
        </div>
      </div>
    </footer>
  )
}
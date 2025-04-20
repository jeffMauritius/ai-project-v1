import Link from 'next/link'
import PageNavigation from '../components/PageNavigation'

export default function NotFound() {
  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Partenaire non trouvé</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Désolé, le partenaire que vous recherchez n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link 
            href="/"
            className="inline-block bg-pink-600 text-white py-3 px-6 rounded-lg hover:bg-pink-500 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  )
}
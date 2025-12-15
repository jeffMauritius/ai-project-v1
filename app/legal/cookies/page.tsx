import { PageNavigation } from '../../components/PageNavigation'

export default function Cookies() {
  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Politique des cookies
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comment nous utilisons les cookies pour améliorer votre expérience.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">BANDEAU COOKIES</h3>
            <div className="prose dark:prose-invert">
              <p>
                Ce site utilise des cookies afin d&apos;améliorer votre expérience utilisateur. En poursuivant votre navigation, vous acceptez l&apos;utilisation des cookies conformément à notre politique de confidentialité.
              </p>
              <p className="mt-4">
                <strong>Boutons recommandés :</strong>
              </p>
              <p>
                Accepter – Paramétrer – Refuser
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
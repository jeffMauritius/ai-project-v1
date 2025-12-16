import { PageNavigation } from '../../components/PageNavigation'

export default function Privacy() {
  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Politique de confidentialité
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comment nous protégeons vos données personnelles.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <div className="prose dark:prose-invert">
              <p>
                Les données personnelles collectées sur monmariage.ai sont strictement nécessaires au fonctionnement de la plateforme.
              </p>
              <p>Elles concernent :</p>
              <ul>
                <li>l&apos;inscription des couples,</li>
                <li>l&apos;inscription des prestataires,</li>
                <li>les échanges via la plateforme.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Utilisation des données</h3>
            <div className="prose dark:prose-invert">
              <p>Ces données :</p>
              <ul>
                <li>ne sont ni cédées, ni vendues,</li>
                <li>sont stockées de manière sécurisée,</li>
                <li>sont utilisées uniquement dans le cadre du service.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Vos droits</h3>
            <div className="prose dark:prose-invert">
              <p>Conformément au RGPD, vous disposez d&apos;un droit :</p>
              <ul>
                <li>d&apos;accès,</li>
                <li>de rectification,</li>
                <li>de suppression.</li>
              </ul>
              <p className="mt-4">
                Toute demande doit être adressée à : <a href="mailto:contact@monmariage.ai" className="text-blue-600 dark:text-blue-400 hover:underline">contact@monmariage.ai</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
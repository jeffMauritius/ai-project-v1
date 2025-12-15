import { PageNavigation } from '../../components/PageNavigation'

export default function Terms() {
  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Conditions générales d&apos;utilisation
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Les règles qui régissent l&apos;utilisation de notre plateforme.
            </p>
          </div>

          {/* Mentions légales */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              MENTIONS LÉGALES – monmariage.ai
            </h2>
            
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Éditeur du site</h3>
              <div className="prose dark:prose-invert">
                <p><strong>SARL Monolythe</strong></p>
                <p>Siège social : 1180 route des Hauts Fourneaux – 01150 Villebois – France</p>
                <p>SIRET : 810 607 440 00015</p>
                <p>Forme juridique : SARL</p>
                <p>Responsable de publication : Le gérant de la SARL Monolythe</p>
                <p>Email : <a href="mailto:contact@monmariage.ai" className="text-blue-600 dark:text-blue-400 hover:underline">contact@monmariage.ai</a></p>
                <p>Téléphone : <a href="tel:0621778117" className="text-blue-600 dark:text-blue-400 hover:underline">06 21 77 81 17</a></p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 bg-white dark:bg-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Hébergeur du site</h3>
              <div className="prose dark:prose-invert">
                <p>GoDaddy</p>
                <p>(Société GoDaddy – Hébergeur web)</p>
              </div>
            </div>
          </div>

          {/* Conditions générales */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              CONDITIONS GÉNÉRALES D&apos;UTILISATION (CGU)
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Plateforme gratuite – mise en relation
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article 1 – Objet</h3>
            <div className="prose dark:prose-invert">
              <p>
                Le site monmariage.ai est une plateforme de mise en relation entre :
              </p>
              <ul>
                <li>des couples préparant leur mariage,</li>
                <li>des prestataires spécialisés dans l&apos;événementiel (lieux de réception, traiteurs, photographes, DJ, wedding planners, etc.).</li>
              </ul>
              <p>Le site a pour unique vocation de faciliter la recherche de prestataires.</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article 2 – Accès au service</h3>
            <div className="prose dark:prose-invert">
              <p>L&apos;accès au site est actuellement :</p>
              <ul>
                <li>gratuit pour les couples,</li>
                <li>gratuit pour les prestataires.</li>
              </ul>
              <p>
                La société Monolythe se réserve le droit d&apos;introduire ultérieurement des offres payantes, notamment pour les prestataires, sans obligation de maintenir la gratuité.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article 3 – Rôle de la plateforme</h3>
            <div className="prose dark:prose-invert">
              <p>Monmariage.ai agit exclusivement en qualité d&apos;intermédiaire technique.</p>
              <p>La plateforme :</p>
              <ul>
                <li>ne vend aucune prestation de mariage,</li>
                <li>ne perçoit aucune commission à ce jour,</li>
                <li>n&apos;intervient pas dans la relation contractuelle,</li>
                <li>n&apos;est pas responsable des devis, contrats, paiements ou litiges.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article 4 – Obligations des prestataires</h3>
            <div className="prose dark:prose-invert">
              <p>Les prestataires s&apos;engagent à :</p>
              <ul>
                <li>fournir des informations exactes,</li>
                <li>être légalement déclarés,</li>
                <li>disposer des assurances obligatoires,</li>
                <li>respecter leurs engagements auprès des couples.</li>
              </ul>
              <p>Monmariage.ai se réserve le droit de suspendre ou supprimer tout compte non conforme.</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article 5 – Responsabilité</h3>
            <div className="prose dark:prose-invert">
              <p>Monmariage.ai ne peut en aucun cas être tenu responsable :</p>
              <ul>
                <li>de la qualité des prestations,</li>
                <li>des annulations,</li>
                <li>des retards,</li>
                <li>des litiges,</li>
                <li>des dommages matériels ou corporels,</li>
                <li>des défauts de paiement entre utilisateurs.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article 6 – Données personnelles</h3>
            <div className="prose dark:prose-invert">
              <p>Les données sont utilisées uniquement pour :</p>
              <ul>
                <li>la gestion des comptes,</li>
                <li>la mise en relation,</li>
                <li>la communication entre utilisateurs.</li>
              </ul>
              <p>Aucune donnée n&apos;est vendue ni cédée à des tiers.</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article 7 – Propriété intellectuelle</h3>
            <div className="prose dark:prose-invert">
              <p>
                Le nom monmariage.ai, les visuels, textes, logos, outils, algorithmes et contenus sont protégés.
              </p>
              <p>Toute reproduction est interdite sans autorisation écrite.</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article 8 – Évolution du service</h3>
            <div className="prose dark:prose-invert">
              <p>La société Monolythe se réserve le droit de :</p>
              <ul>
                <li>modifier les fonctionnalités,</li>
                <li>suspendre temporairement ou définitivement le site,</li>
                <li>faire évoluer son modèle économique.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article 9 – Droit applicable</h3>
            <div className="prose dark:prose-invert">
              <p>Les présentes CGU sont soumises au droit français.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
import Navbar from './components/Navbar'
import AISearchBar from './components/AISearchBar'
import Footer from './components/Footer'
import React from 'react'
import { 
  MagnifyingGlassIcon, 
  BuildingLibraryIcon, 
  CalendarDaysIcon,
  HeartIcon,
  CakeIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <div className="relative isolate">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 dark:bg-gray-900">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                Planifiez le mariage de vos rêves avec l&apos;IA
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Trouvez les meilleurs lieux et prestataires pour votre mariage grâce à notre assistant intelligent.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <AISearchBar />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-gray-900 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-pink-600">Planification Simplifiée</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Tout ce dont vous avez besoin pour organiser votre mariage
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900 dark:text-white">
                      <feature.icon className="h-8 w-8 text-pink-600 dark:text-pink-400" aria-hidden="true" />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                      <p className="flex-auto">{feature.description}</p>
                      <ul className="mt-4 space-y-2 text-sm">
                        {feature.examples.map((example, index) => (
                          <li key={index} className="flex items-center gap-x-2">
                            {React.createElement(feature.exampleIcons[index % feature.exampleIcons.length], {
                              className: "h-5 w-5 text-pink-400 dark:text-pink-300"
                            })}
                            {example}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

const features = [
  {
    name: 'Recherche IA',
    icon: MagnifyingGlassIcon,
    description: 'Notre assistant intelligent comprend vos besoins et vous propose les meilleures options adaptées à vos critères.',
    examples: [
      'Suggestions personnalisées basées sur vos préférences',
      'Filtrage intelligent par budget et style',
      'Recommandations contextuelles'
    ],
    exampleIcons: [HeartIcon, CakeIcon, MusicalNoteIcon]
  },
  {
    name: 'Large Sélection',
    icon: BuildingLibraryIcon,
    description: 'Accédez à une vaste collection de lieux et prestataires soigneusement sélectionnés pour votre grand jour.',
    examples: [
      'Châteaux et domaines d\'exception',
      'Photographes et vidéastes professionnels',
      'Traiteurs gastronomiques'
    ],
    exampleIcons: [HeartIcon, CakeIcon, MusicalNoteIcon]
  },
  {
    name: 'Organisation Facile',
    icon: CalendarDaysIcon,
    description: 'Gérez tous les aspects de votre mariage en un seul endroit, de la recherche initiale jusqu\'à la coordination finale.',
    examples: [
      'Planning interactif personnalisé',
      'Liste de tâches intelligente',
      'Coordination avec les prestataires'
    ],
    exampleIcons: [HeartIcon, CakeIcon, MusicalNoteIcon]
  }
]
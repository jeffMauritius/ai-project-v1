import Image from 'next/image'
import AISearchBar from '../components/AISearchBar'
import { PageNavigation } from '../components/PageNavigation'
import { StarIcon } from '@heroicons/react/24/solid'
import { MapPinIcon, BanknotesIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'

const mockResults = [
  {
    id: 1,
    title: "Château de Vaux-le-Vicomte",
    description: "Magnifique château du XVIIe siècle avec jardins à la française, parfait pour un mariage royal.",
    image: "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    location: "Maincy, France",
    price: "À partir de 15000€",
    availability: "Disponible en 2024"
  },
  {
    id: 2,
    title: "Domaine des Roses",
    description: "Élégant domaine viticole avec vue panoramique sur les vignes et une cave historique.",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    location: "Saint-Émilion, France",
    price: "À partir de 8000€",
    availability: "Disponible en 2024"
  },
  {
    id: 3,
    title: "Manoir de la Loire",
    description: "Manoir historique du XVIe siècle avec parc arboré et vue sur la Loire.",
    image: "https://images.unsplash.com/photo-1568314735654-58688d2c2313?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    location: "Amboise, France",
    price: "À partir de 12000€",
    availability: "Disponible en 2024"
  }
]

export default function Results({ searchParams }: { searchParams: { q: string } }) {
  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Résultats pour ;
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {mockResults.length} lieux trouvés correspondant à votre recherche
            </p>
            <div className="mt-6">
              <AISearchBar />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockResults.map((result) => (
              <div key={result.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={result.image}
                    alt={result.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {result.title}
                    </h2>
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400" />
                      <span className="ml-1 text-gray-600 dark:text-gray-400">{result.rating}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                    {result.description}
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {result.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <BanknotesIcon className="h-4 w-4 mr-2" />
                      {result.price}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      {result.availability}
                    </div>
                  </div>
                  <a 
                    href={`/venue/${result.id}`}
                    className="mt-6 block w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-500 transition-colors text-center"
                  >
                    Voir les détails
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
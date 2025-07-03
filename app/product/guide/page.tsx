import { PageNavigation } from '../../components/PageNavigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const guides = [
  {
    title: "Commencer l'organisation",
    description: "Les premières étapes essentielles",
    sections: [
      "Définir son budget",
      "Choisir une date",
      "Établir la liste des invités",
      "Rechercher le lieu idéal"
    ]
  },
  {
    title: "Choisir ses prestataires",
    description: "Trouver les meilleurs professionnels",
    sections: [
      "Traiteur et menu",
      "Photographe et vidéaste",
      "Musique et animation",
      "Fleuriste et décoration"
    ]
  },
  {
    title: "Gérer les invités",
    description: "Communication et organisation",
    sections: [
      "Envoyer les faire-part",
      "Gérer les réponses",
      "Organiser le plan de table",
      "Prévoir les hébergements"
    ]
  },
  {
    title: "Planifier la cérémonie",
    description: "Les détails du jour J",
    sections: [
      "Déroulé de la journée",
      "Coordination des prestataires",
      "Check-list finale",
      "Timing et logistique"
    ]
  }
]

export default function Guide() {
  return (
    <div>
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {`Guide d'organisation`}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tout ce que vous devez savoir pour organiser votre mariage sereinement, étape par étape.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {guides.map((guide, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {guide.sections.map((section, sectionIndex) => (
                      <li key={sectionIndex} className="text-gray-600 dark:text-gray-300">
                        {section}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    Lire le guide
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
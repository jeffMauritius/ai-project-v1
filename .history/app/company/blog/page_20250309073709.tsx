import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageNavigation from '../../components/PageNavigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Blog() {
  return (
    <>
      <Navbar />
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Blog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Conseils, tendances et inspirations pour votre mariage.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Article en construction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Page en construction
                </p>
                <Button variant="outline" className="w-full">
                  Lire l'article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
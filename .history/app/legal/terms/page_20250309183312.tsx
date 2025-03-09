import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageNavigation from '../../components/PageNavigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Terms() {
  return (
    <>
      <Navbar />
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {`Conditions d'utilisation`}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Veuillez lire attentivement ces conditions avant d'utiliser nos services.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptation des conditions</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert">
              <p>Page en construction</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
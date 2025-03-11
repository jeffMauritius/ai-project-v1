import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageNavigation from '../../components/PageNavigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Cookies() {
  return (
    <>
      <Navbar />
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
          <Card>
            <CardHeader>
              <CardTitle>1. Qu'est-ce qu'un cookie ?</CardTitle>
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
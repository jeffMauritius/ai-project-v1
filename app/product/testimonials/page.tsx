import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PageNavigation from '../../components/PageNavigation'

export default function Testimonials() {
  return (
    <>
      <Navbar />
      <PageNavigation />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Témoignages</h1>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>Page en construction</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
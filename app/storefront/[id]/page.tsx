import { notFound } from 'next/navigation'

export default async function StorefrontPublicPage({ params }: { params: { id: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/partner-storefront?id=${params.id}`, { cache: 'no-store' })
  if (!res.ok) return notFound()
  const storefront = await res.json()

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center gap-4 mb-8">
        {storefront.logo && (
          <img src={storefront.logo} alt="Logo" className="h-20 w-20 rounded-full object-cover border" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{storefront.companyName}</h1>
          <p className="text-gray-600 dark:text-gray-300">{storefront.serviceType} - {storefront.venueType}</p>
        </div>
      </div>
      <div className="prose dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: storefront.description }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Adresse</h2>
          <p>{storefront.venueAddress}</p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Contact</h2>
          <p>SIRET : {storefront.siret}</p>
          <p>TVA : {storefront.vatNumber}</p>
        </div>
      </div>
    </div>
  )
} 
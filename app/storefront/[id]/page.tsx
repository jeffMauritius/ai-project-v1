import { notFound } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import ImageGallery from './components/ImageGallery'
import ImageCarousel from './components/ImageCarousel'
import ContactCard from './components/ContactCard'
import ChatCard from './components/ChatCard'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { ShareButton } from '@/components/ui/ShareButton'
import receptionVenueOptions from '../../../partners-options/reception-venue-options.json'

async function getStorefrontData(id: string) {
  const storefront = await prisma.partnerStorefront.findUnique({
    where: { id },
    include: {
      media: {
        orderBy: { order: 'asc' }
      },
      receptionSpaces: true,
      receptionOptions: true
    }
  })
  return storefront
}

export default async function StorefrontPublicPage({ params }: { params: { id: string } }) {
  const storefront = await getStorefrontData(params.id)
  
  if (!storefront) {
    return notFound()
  }

  const allImages = storefront.media
  const galleryImages = storefront.media.slice(6) // Images pour la galerie (après les 6 premières)

  // Récupérer les options selon le type de service
  const getOptionsForServiceType = (serviceType: string) => {
    switch (serviceType) {
      case 'LIEU':
        return receptionVenueOptions.lieu_reception.sections
      default:
        return []
    }
  }

  const serviceOptions = getOptionsForServiceType(storefront.serviceType)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-0 py-8">
        {/* Section principale avec carrousel et contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Carrousel - 2/3 de la largeur */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{storefront.companyName}</h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{storefront.venueAddress}</span>
                  </div>
                </div>
                {/* Avis clients à droite du titre */}
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">4.5/5</span>
                  </div>
                  <p className="text-xs text-gray-500">(12 avis)</p>
                  <button className="text-pink-600 text-xs hover:underline">
                    Voir tous les avis
                  </button>
                </div>
              </div>
            </div>
            <div className="h-80 md:h-96">
              <ImageCarousel images={allImages} title={storefront.companyName} />
            </div>
            {/* Boutons sous le carrousel */}
            <div className="mt-4 flex items-center gap-4">
              <FavoriteButton
                url={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/storefront/${storefront.id}`}
                title={`${storefront.companyName} - ${storefront.venueAddress}`}
                showText={true}
                className="bg-pink-600 text-white hover:bg-pink-700"
              />
              <ShareButton
                url={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/storefront/${storefront.id}`}
                title={`${storefront.companyName} - ${storefront.venueAddress}`}
                showText={true}
                className="border border-gray-300 hover:bg-gray-50"
              />
            </div>
          </div>

          {/* Carte de contact - 1/3 de la largeur */}
          <div className="lg:col-span-1">
            <div className="mb-4 invisible">
              {/* Espace invisible pour aligner avec le titre */}
              <div style={{ height: '5.25rem' }}></div>
            </div>
            <div className="h-80 md:h-96 flex flex-col justify-end">
              <ContactCard
                storefrontId={storefront.id}
                companyName={storefront.companyName}
                venueAddress={storefront.venueAddress || ''}
                venueType={storefront.venueType || ''}
                serviceType={storefront.serviceType || ''}
                interventionType={storefront.interventionType || ''}
                interventionRadius={storefront.interventionRadius || 0}
              />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">À propos de {storefront.companyName}</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {storefront.description}
                </p>
              </div>
            </section>

            {/* Galerie d'images */}
            {galleryImages.length > 0 && (
              <ImageLightbox 
                images={galleryImages.map((media) => ({
                  id: media.id,
                  url: media.url,
                  title: media.title || undefined,
                  description: media.description || undefined,
                  alt: media.title || `${storefront.companyName} - ${media.type}`
                }))}
                title="Galerie photos"
                gridCols={4}
              />
            )}
          </div>

          {/* Chat en temps réel */}
          <div className="lg:col-span-1">
            <div className="h-96">
              <ChatCard companyName={storefront.companyName} />
            </div>
          </div>
        </div>

        {/* Options de réception - Utilise toute la largeur */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Options de réception</h2>
          <div className="bg-white rounded-lg p-6 border">
            {serviceOptions.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-8 last:mb-0">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">{section.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {section.fields.map((field, fieldIndex) => {
                    // Récupérer la valeur depuis les options du storefront
                    const optionsData = storefront.options as Record<string, any> || {}
                    const receptionData = storefront.receptionOptions as Record<string, any> || {}
                    const fieldValue = optionsData[field.id] || receptionData[field.id]
                    
                    return (
                      <div key={fieldIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-sm text-gray-600">{field.question} :</span>
                        <span className="font-semibold text-sm">
                          {fieldValue !== undefined && fieldValue !== null && fieldValue !== '' 
                            ? String(fieldValue)
                            : 'Non renseigné'
                          }
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
} 
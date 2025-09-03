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
  try {
    const storefront = await prisma.partnerStorefront.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { order: 'asc' }
        },
        establishment: true,
        partner: {
          select: {
            id: true,
            companyName: true,
            description: true,
            serviceType: true,
            billingCity: true,
            basePrice: true,
            maxCapacity: true,
            options: true,
            searchableOptions: true
          }
        }
      }
    })
    
    if (!storefront) {
      console.log(`[STOREFRONT] Storefront ${id} non trouvé`)
      return null
    }
    
    console.log(`[STOREFRONT] Storefront ${id} trouvé:`, {
      type: storefront.type,
      hasEstablishment: !!storefront.establishment,
      hasPartner: !!storefront.partner,
      mediaCount: storefront.media.length,
      partnerOptions: storefront.partner?.options ? 'OUI' : 'NON'
    })
    
    return storefront
  } catch (error) {
    console.error(`[STOREFRONT] Erreur lors de la récupération:`, error)
    return null
  }
}

export default async function StorefrontPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const storefront = await getStorefrontData(id)
  
  if (!storefront) {
    return notFound()
  }

  const allImages = storefront.media
  const galleryImages = storefront.media.slice(6) // Images pour la galerie (après les 6 premières)

  // Déterminer le type de prestataire et ses informations
  const isVenue = storefront.type === 'VENUE'
  const isPartner = storefront.type === 'PARTNER'
  
  let serviceType = ''
  let companyName = ''
  let description = ''
  let venueAddress = ''
  let venueType = ''
  let rating = 0
  let price = 0
  let capacity = 0

  if (isVenue && storefront.establishment) {
    const establishment = storefront.establishment
    serviceType = 'LIEU'
    companyName = establishment.name
    description = establishment.description || ''
    venueAddress = `${establishment.city}, ${establishment.region}`
    venueType = establishment.venueType || ''
    rating = establishment.rating || 0
    price = establishment.startingPrice || 0
    capacity = establishment.maxCapacity || 0
  } else if (isPartner && storefront.partner) {
    const partner = storefront.partner
    serviceType = partner.serviceType
    companyName = partner.companyName
    description = partner.description || ''
    venueAddress = `${partner.billingCity}, France`
    venueType = partner.serviceType
    rating = 4.5 // Note par défaut pour les partenaires
    price = partner.basePrice || 0
    capacity = partner.maxCapacity || 0
  }

  // Récupérer les options selon le type de service
  const getOptionsForServiceType = async (serviceType: string) => {
    try {
      switch (serviceType) {
        case 'LIEU':
          return receptionVenueOptions.lieu_reception.sections
        case 'TRAITEUR':
          const catererOptions = await import('../../../partners-options/caterer-options.json')
          return (catererOptions.default as any).traiteur.sections
        case 'PHOTOGRAPHE':
          const photographerOptions = await import('../../../partners-options/photographer-options.json')
          return (photographerOptions.default as any).photographe.sections
        case 'MUSIQUE':
          const musicOptions = await import('../../../partners-options/music-dj-options.json')
          return (musicOptions.default as any).musique_dj.sections
        case 'VOITURE':
        case 'BUS':
          const vehicleOptions = await import('../../../partners-options/vehicle-options.json')
          return (vehicleOptions.default as any).voiture.sections
        case 'DECORATION':
          const decorationOptions = await import('../../../partners-options/decoration-options.json')
          return (decorationOptions.default as any).decoration.sections
        case 'CHAPITEAU':
          const tentOptions = await import('../../../partners-options/tent-options.json')
          return (tentOptions.default as any).chapiteau.sections
        case 'ANIMATION':
          const animationOptions = await import('../../../partners-options/animation-options.json')
          return (animationOptions.default as any).animation.sections
        case 'FLORISTE':
          const floristOptions = await import('../../../partners-options/florist-options.json')
          return (floristOptions.default as any).fleurs.sections
        case 'LISTE':
          const registryOptions = await import('../../../partners-options/wedding-registry-options.json')
          return (registryOptions.default as any).liste_cadeau_mariage.sections
        case 'ORGANISATION':
          const plannerOptions = await import('../../../partners-options/wedding-planner-options.json')
          return (plannerOptions.default as any).organisation.sections
        case 'VIDEO':
          const videoOptions = await import('../../../partners-options/video-options.json')
          return (videoOptions.default as any).video.sections
        case 'LUNE_DE_MIEL':
          const travelOptions = await import('../../../partners-options/honeymoon-travel-options.json')
          return (travelOptions.default as any).voyage.sections
        case 'WEDDING_CAKE':
          const cakeOptions = await import('../../../partners-options/wedding-cake-options.json')
          return (cakeOptions.default as any).wedding_cake.sections
        case 'OFFICIANT':
          const officiantOptions = await import('../../../partners-options/officiant-options.json')
          return (officiantOptions.default as any).officiants.sections
        case 'FOOD_TRUCK':
          const foodTruckOptions = await import('../../../partners-options/food-truck-options.json')
          return (foodTruckOptions.default as any).food_truck.sections
        case 'VIN':
          const wineOptions = await import('../../../partners-options/wine-options.json')
          return (wineOptions.default as any).vin.sections
        case 'FAIRE_PART':
          const invitationOptions = await import('../../../partners-options/invitation-options.json')
          return (invitationOptions.default as any).faire_part.sections
        case 'CADEAUX_INVITES':
          const giftsOptions = await import('../../../partners-options/guest-gifts-options.json')
          return (giftsOptions.default as any).cadeaux_invites.sections
        default:
          return []
      }
    } catch (error) {
      console.error('Erreur lors du chargement des options:', error)
      return []
    }
  }

  const serviceOptions = await getOptionsForServiceType(serviceType)

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
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{companyName}</h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{venueAddress}</span>
                  </div>
                </div>
                {/* Avis clients à droite du titre */}
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{rating}/5</span>
                  </div>
                  <p className="text-xs text-gray-500">(12 avis)</p>
                  <button className="text-pink-600 text-xs hover:underline">
                    Voir tous les avis
                  </button>
                </div>
              </div>
            </div>
            <div className="h-80 md:h-96">
              <ImageCarousel images={allImages} title={companyName} />
            </div>
            {/* Boutons sous le carrousel */}
            <div className="mt-4 flex items-center gap-4">
              <FavoriteButton
                storefrontId={storefront.id}
                name={companyName}
                location={venueAddress}
                rating={rating}
                numberOfReviews={12}
                description={description}
                showText={true}
                className="bg-pink-600 text-white hover:bg-pink-700"
              />
              <ShareButton
                url={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/storefront/${storefront.id}`}
                title={`${companyName} - ${venueAddress}`}
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
                companyName={companyName}
                venueAddress={venueAddress}
                venueType={venueType}
                serviceType={serviceType}
                interventionType={venueType}
                interventionRadius={50}
              />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">À propos de {companyName}</h2>
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
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
                  alt: media.title || `${companyName} - ${media.type}`
                }))}
                title="Galerie photos"
                gridCols={4}
              />
            )}
          </div>

          {/* Chat en temps réel */}
          <div className="lg:col-span-1">
            <div className="h-96">
              <ChatCard companyName={companyName} storefrontId={id} />
            </div>
          </div>
        </div>

        {/* Options de réception - Utilise toute la largeur */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Options de réception</h2>
          <div className="bg-white rounded-lg p-6 border">
            {serviceOptions.length > 0 ? (
              serviceOptions.map((section: any, sectionIndex: number) => (
                <div key={sectionIndex} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">{section.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {section.fields?.map((field: any, fieldIndex: number) => {
                      // Récupérer la valeur sauvegardée pour ce champ
                      let savedValue = null;
                      
                      if (storefront.partner?.options) {
                        // Déterminer le type de prestataire selon le serviceType
                        let providerType = '';
                        switch (serviceType) {
                          case 'LIEU':
                            providerType = 'reception-venue';
                            break;
                          case 'PHOTOGRAPHE':
                            providerType = 'photographer';
                            break;
                          case 'TRAITEUR':
                            providerType = 'caterer';
                            break;
                          case 'MUSIQUE':
                            providerType = 'music-dj';
                            break;
                          case 'VOITURE':
                          case 'BUS':
                            providerType = 'vehicle';
                            break;
                          case 'DECORATION':
                            providerType = 'decoration';
                            break;
                          case 'CHAPITEAU':
                            providerType = 'tent';
                            break;
                          case 'ANIMATION':
                            providerType = 'animation';
                            break;
                          case 'FLORISTE':
                            providerType = 'florist';
                            break;
                          case 'LISTE':
                            providerType = 'wedding-registry';
                            break;
                          case 'ORGANISATION':
                            providerType = 'wedding-planner';
                            break;
                          case 'VIDEO':
                            providerType = 'video';
                            break;
                          case 'LUNE_DE_MIEL':
                            providerType = 'honeymoon-travel';
                            break;
                          case 'WEDDING_CAKE':
                            providerType = 'wedding-cake';
                            break;
                          case 'OFFICIANT':
                            providerType = 'officiant';
                            break;
                          case 'FOOD_TRUCK':
                            providerType = 'food-truck';
                            break;
                          case 'VIN':
                            providerType = 'wine';
                            break;
                          case 'FAIRE_PART':
                            providerType = 'invitation';
                            break;
                          case 'CADEAUX_INVITES':
                            providerType = 'guest-gifts';
                            break;
                          default:
                            providerType = '';
                        }
                        
                        // Récupérer les options pour ce type de prestataire
                        const providerOptions = storefront.partner.options[providerType];
                        if (providerOptions && providerOptions[field.id]) {
                          savedValue = providerOptions[field.id];
                        }
                      }
                      
                      // Formater la valeur pour l'affichage
                      let displayValue = 'Non renseigné';
                      if (savedValue !== null && savedValue !== undefined && savedValue !== '') {
                        if (typeof savedValue === 'boolean') {
                          displayValue = savedValue ? 'Oui' : 'Non';
                        } else if (Array.isArray(savedValue)) {
                          displayValue = savedValue.join(', ');
                        } else {
                          displayValue = String(savedValue);
                        }
                      }
                      
                      return (
                        <div key={fieldIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600">{field.question} :</span>
                          <span className="font-semibold text-sm">
                            {displayValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucune option configurée pour ce type de service.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
} 
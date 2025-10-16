import { notFound } from 'next/navigation'
import { 
  MapPin, 
  Star, 
  Users, 
  Square, 
  Home, 
  Car, 
  Music, 
  Camera, 
  Utensils, 
  Palette, 
  Tent, 
  Gift, 
  Calendar, 
  Clock, 
  Euro, 
  Wifi, 
  ParkingCircle, 
  TreePine, 
  Building, 
  Accessibility, 
  Sun, 
  Moon, 
  Coffee, 
  Wine, 
  Cake, 
  Heart, 
  Sparkles, 
  Mic, 
  Volume2, 
  Video, 
  Image, 
  FileText, 
  Mail, 
  Phone, 
  Globe, 
  Map, 
  Navigation, 
  Route, 
  Bus, 
  Truck, 
  Flower2, 
  Crown, 
  Ring, 
  Plane, 
  Bed, 
  Shower, 
  Waves, 
  Mountain, 
  Umbrella, 
  Thermometer, 
  Wind, 
  Droplets, 
  Lightbulb, 
  Zap, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  HelpCircle, 
  Settings, 
  Wrench, 
  Hammer, 
  Scissors, 
  Paintbrush, 
  Brush, 
  PenTool, 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  Grid3X3, 
  Columns, 
  Rows, 
  Layout, 
  Layers, 
  Copy, 
  Move, 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Desktop, 
  Server, 
  Database, 
  HardDrive, 
  Folder, 
  File, 
  Archive, 
  Download, 
  Upload, 
  Share, 
  Link, 
  ExternalLink, 
  Bookmark, 
  Tag, 
  Tags, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Trash2, 
  Edit, 
  Save, 
  RefreshCw, 
  RotateCcw as Refresh, 
  Play, 
  Pause, 
  Stop, 
  SkipBack, 
  SkipForward, 
  VolumeX, 
  Volume1, 
  Volume2 as Volume, 
  Headphones, 
  Radio, 
  Tv, 
  Film, 
  Clapperboard, 
  Camera as CameraIcon, 
  Video as VideoIcon, 
  Image as ImageIcon, 
  Mic as MicIcon, 
  MicOff, 
  Phone as PhoneIcon, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  PhoneOff, 
  MessageCircle, 
  MessageSquare, 
  Mail as MailIcon, 
  Send, 
  Inbox, 
  Outbox, 
  Archive as ArchiveIcon, 
  Trash, 
  Trash2 as TrashIcon, 
  Folder as FolderIcon, 
  FolderOpen, 
  File as FileIcon, 
  FileText as FileTextIcon, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  FileCode, 
  FileSpreadsheet, 
  FilePdf, 
  FileWord, 
  FileExcel, 
  FilePowerpoint, 
  FileZip, 
  FileCheck, 
  FileX, 
  FilePlus, 
  FileMinus, 
  FileEdit, 
  FileSearch, 
  FileSlash, 
  FileQuestion, 
  FileWarning, 
  FileInfo, 
  FileHeart, 
  FileClock, 
  FileUp, 
  FileDown, 
  FileLeft, 
  FileRight, 
  FileSymlink, 
  FileBinary, 
  FileType, 
  FileType2, 
  FileJson, 
  FileJs, 
  FileTs, 
  FileJsx, 
  FileTsx, 
  FileVue, 
  FileSvelte, 
  FileHtml, 
  FileCss, 
  FileScss, 
  FileLess, 
  FileSass, 
  FileStylus, 
  FileMarkdown, 
  FileYaml, 
  FileToml, 
  FileIni, 
  FileEnv, 
  FileGit, 
  FileGitignore, 
  FileDocker, 
  FileKubernetes, 
  FileTerraform, 
  FileAnsible, 
  FileJenkins, 
  FileTravis, 
  FileCircleci, 
  FileGithub, 
  FileGitlab, 
  FileBitbucket, 
  FileAzure, 
  FileAws, 
  FileGcp, 
  FileDigitalocean, 
  FileHeroku, 
  FileVercel, 
  FileNetlify, 
  FileSurge, 
  FileFirebase, 
  FileSupabase, 
  FilePlanetscale, 
  FileMongodb, 
  FilePostgres, 
  FileMysql, 
  FileRedis, 
  FileElasticsearch, 
  FileKibana, 
  FileLogstash, 
  FileBeats, 
  FileDocker as Docker, 
  FileKubernetes as Kubernetes, 
  FileTerraform as Terraform, 
  FileAnsible as Ansible, 
  FileJenkins as Jenkins, 
  FileTravis as Travis, 
  FileCircleci as Circleci, 
  FileGithub as Github, 
  FileGitlab as Gitlab, 
  FileBitbucket as Bitbucket, 
  FileAzure as Azure, 
  FileAws as Aws, 
  FileGcp as Gcp, 
  FileDigitalocean as Digitalocean, 
  FileHeroku as Heroku, 
  FileVercel as Vercel, 
  FileNetlify as Netlify, 
  FileSurge as Surge, 
  FileFirebase as Firebase, 
  FileSupabase as Supabase, 
  FilePlanetscale as Planetscale, 
  FileMongodb as Mongodb, 
  FilePostgres as Postgres, 
  FileMysql as Mysql, 
  FileRedis as Redis, 
  FileElasticsearch as Elasticsearch, 
  FileKibana as Kibana, 
  FileLogstash as Logstash, 
  FileBeats as Beats
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { transformEstablishmentImages } from '@/lib/image-url-transformer'
import ImageGallery from './components/ImageGallery'
import ImageCarousel from './components/ImageCarousel'
import ContactCard from './components/ContactCard'
import ChatCard from './components/ChatCard'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { ShareButton } from '@/components/ui/ShareButton'
import { promises as fs } from 'fs'
import path from 'path'
import { getSectionIcon } from '@/lib/field-icons'

async function getStorefrontData(id: string) {
  try {
    // D'abord, essayer de trouver un storefront avec cet ID
    let storefront = await prisma.partnerStorefront.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        isActive: true,
        images: true, // Inclure le tableau images du storefront
        media: {
          orderBy: { order: 'asc' }
        },
        establishment: {
          select: {
            id: true,
            name: true,
            description: true,
            city: true,
            region: true,
            country: true,
            startingPrice: true,
            currency: true,
            maxCapacity: true,
            rating: true,
            reviewCount: true,
            venueType: true,
            hasParking: true,
            hasTerrace: true,
            hasKitchen: true,
            hasAccommodation: true,
            images: true // Inclure le tableau images qui contient les URLs Vercel Blob
          }
        },
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
            searchableOptions: true,
            images: true // Inclure les images de la collection partners
          }
        }
      }
    })
    
    // Si pas de storefront trouvé, chercher dans les établissements
    if (!storefront) {
      const establishment = await prisma.establishment.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          city: true,
          region: true,
          country: true,
          startingPrice: true,
          currency: true,
          maxCapacity: true,
          rating: true,
          reviewCount: true,
          venueType: true,
          hasParking: true,
          hasTerrace: true,
          hasKitchen: true,
          hasAccommodation: true,
          images: true
        }
      })
      
      if (establishment) {
        // Créer un objet storefront fictif pour l'établissement
        storefront = {
          id: establishment.id,
          type: 'VENUE' as const,
          isActive: true,
          images: [],
          media: [],
          establishment: establishment,
          partner: null
        }
      }
    }
    
    // Si toujours pas trouvé, chercher dans les partenaires
    if (!storefront) {
      const partner = await prisma.partner.findUnique({
        where: { id },
        select: {
          id: true,
          companyName: true,
          description: true,
          serviceType: true,
          billingCity: true,
          basePrice: true,
          maxCapacity: true,
          options: true,
          searchableOptions: true,
          images: true
        }
      })
      
      if (partner) {
        // Créer un objet storefront fictif pour le partenaire
        storefront = {
          id: partner.id,
          type: 'PARTNER' as const,
          isActive: true,
          images: [],
          media: [],
          establishment: null,
          partner: partner
        }
      }
    }
    
    if (!storefront) {
      console.log(`[STOREFRONT] Aucun élément trouvé avec l'ID ${id}`)
      return null
    }
    
    console.log(`[STOREFRONT] Élément ${id} trouvé:`, {
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

  // Déterminer le type de prestataire et ses informations
  const isVenue = storefront.type === 'VENUE'
  const isPartner = storefront.type === 'PARTNER'
  
  // Récupérer les images selon le type de storefront
  let allImages = storefront.media
  
  // Si pas de médias dans la table relationnelle, utiliser les images du storefront
  if (allImages.length === 0 && storefront.images && storefront.images.length > 0) {
    allImages = storefront.images.map((url, index) => ({
      id: `img-${index}`,
      url: url,
      type: 'IMAGE',
      title: null,
      description: null,
      order: index
    }))
  }
  
  if (isVenue && storefront.establishment?.images && storefront.establishment.images.length > 0) {
    // Pour les lieux, utiliser directement les URLs 960p de la base de données
    allImages = storefront.establishment.images.map((url, index) => ({
      id: `img-${index}`,
      url: url,
      type: 'IMAGE',
      title: null,
      description: null,
      order: index
    }))
  }
  
  if (isPartner && storefront.partner?.images && storefront.partner.images.length > 0) {
    // Pour les partenaires, utiliser les images de la collection partners
    allImages = storefront.partner.images.map((url, index) => ({
      id: `img-${index}`,
      url: url,
      type: 'IMAGE',
      title: null,
      description: null,
      order: index
    }))
  }
  const galleryImages = allImages.slice(6) // Images pour la galerie (après les 6 premières)
  
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

  // Helper function pour charger les options de manière sécurisée
  const loadOptionsSafely = async (fileName: string, propertyPath: string) => {
    try {
      const filePath = path.join(process.cwd(), 'partners-options', fileName)
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(fileContent)
      
      // Vérifier si c'est un placeholder
      if (data.placeholder) {
        console.warn(`⚠️ Fichier ${fileName} contient seulement un placeholder`)
        return []
      }
      
      // Naviguer dans la structure de données
      const pathParts = propertyPath.split('.')
      let result = data
      
      for (const part of pathParts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part]
        } else {
          console.warn(`⚠️ Propriété ${part} non trouvée dans ${fileName}`)
          return []
        }
      }
      
      return result || []
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de ${fileName}:`, error)
      return []
    }
  }

  // Récupérer les options selon le type de service
  const getOptionsForServiceType = async (serviceType: string) => {
    try {
      switch (serviceType) {
        case 'LIEU':
          return await loadOptionsSafely('reception-venue-options.json', 'lieu_reception.sections')
        case 'TRAITEUR':
          return await loadOptionsSafely('caterer-options.json', 'traiteur.sections')
        case 'PHOTOGRAPHE':
          return await loadOptionsSafely('photographer-options.json', 'photographe.sections')
        case 'MUSIQUE':
          return await loadOptionsSafely('music-dj-options.json', 'musique_dj.sections')
        case 'VOITURE':
        case 'BUS':
          return await loadOptionsSafely('vehicle-options.json', 'voiture.sections')
        case 'DECORATION':
          return await loadOptionsSafely('decoration-options.json', 'decoration.sections')
        case 'CHAPITEAU':
          return await loadOptionsSafely('tent-options.json', 'chapiteau.sections')
        case 'ANIMATION':
          return await loadOptionsSafely('animation-options.json', 'animation.sections')
        case 'FLORISTE':
          return await loadOptionsSafely('florist-options.json', 'fleurs.sections')
        case 'LISTE':
          return await loadOptionsSafely('wedding-registry-options.json', 'liste_cadeau_mariage.sections')
        case 'ORGANISATION':
          return await loadOptionsSafely('wedding-planner-options.json', 'organisation.sections')
        case 'VIDEO':
          return await loadOptionsSafely('video-options.json', 'video.sections')
        case 'LUNE_DE_MIEL':
          return await loadOptionsSafely('honeymoon-travel-options.json', 'voyage.sections')
        case 'WEDDING_CAKE':
          return await loadOptionsSafely('wedding-cake-options.json', 'wedding_cake.sections')
        case 'OFFICIANT':
          return await loadOptionsSafely('officiant-options.json', 'officiants.sections')
        case 'FOOD_TRUCK':
          return await loadOptionsSafely('food-truck-options.json', 'food_truck.sections')
        case 'VIN':
          return await loadOptionsSafely('wine-options.json', 'vin.sections')
        case 'FAIRE_PART':
          return await loadOptionsSafely('invitation-options.json', 'faire_part.sections')
        case 'CADEAUX_INVITES':
          return await loadOptionsSafely('guest-gifts-options.json', 'cadeaux_invites.sections')
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
                imageUrl={allImages[0]?.url || '/placeholder-venue.jpg'}
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
          <h2 className="text-2xl font-bold mb-4">Les options {companyName}</h2>
          <div className="bg-white rounded-lg p-6 border">
            {serviceOptions.length > 0 ? (
              serviceOptions.map((section: any, sectionIndex: number) => (
                <div key={sectionIndex} className="mb-8 last:mb-0">
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const SectionIconComponent = getSectionIcon(section.title)
                      return <SectionIconComponent className="w-6 h-6 text-pink-600" />
                    })()}
                    <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {(section.fields || section.options)?.map((field: any, fieldIndex: number) => {
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
                          <span className="font-semibold text-sm text-gray-800">
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
import { MapPin, Phone, Mail } from 'lucide-react'

interface ContactCardProps {
  companyName: string
  venueAddress: string
  venueType: string
  serviceType: string
  interventionType: string
  interventionRadius: number
}

export default function ContactCard({
  companyName,
  venueAddress,
  venueType,
  serviceType,
  interventionType,
  interventionRadius
}: ContactCardProps) {
  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Carte de contact */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-xl font-bold mb-4">Contact</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700 text-sm">{venueAddress}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700 text-sm">Contactez-nous</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700 text-sm">Demander un devis</span>
          </div>
        </div>
        <button className="w-full mt-4 bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium">
          Demander un devis
        </button>
      </div>

      {/* Informations pratiques */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-xl font-bold mb-4">Informations pratiques</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Type de lieu :</span>
            <span className="font-semibold text-sm">{venueType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Service :</span>
            <span className="font-semibold text-sm">{serviceType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Zone d'intervention :</span>
            <span className="font-semibold text-sm">
              {interventionType === 'all_france' ? 'Toute la France' : `${interventionRadius}km`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 
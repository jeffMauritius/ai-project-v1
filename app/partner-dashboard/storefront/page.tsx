"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { StorefrontForm } from "../components/StorefrontForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { PartnerStorefront, ServiceType, VenueType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PartnerStorefrontPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [storefront, setStorefront] = useState<PartnerStorefront | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        const response = await fetch("/api/partner-storefront")
        if (response.ok) {
          const data = await response.json()
          if (data) {
            console.log('[Page] Données reçues:', data)
            setStorefront(data)
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de la vitrine.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.role === "PARTNER") {
      fetchStorefrontData()
    }
  }, [session, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!storefront && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl w-full">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Aucune vitrine trouvée
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Vous n&apos;avez pas encore créé votre vitrine. Créez-la maintenant pour commencer à présenter vos services aux futurs mariés.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Créer ma vitrine
          </Button>
        </div>
      </div>
    )
  }

  // Valeurs par défaut pour StorefrontForm
  const defaultStorefront = {
    id: '',
    companyName: '',
    description: '',
    logo: null,
    isActive: false,
    serviceType: ServiceType.LIEU,
    venueType: VenueType.UNKNOWN,
    billingStreet: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: '',
    siret: '',
    vatNumber: '',
    venueAddress: null,
    venueLatitude: 48.8566,
    venueLongitude: 2.3522,
    interventionType: 'all_france',
    interventionRadius: 50,
    receptionSpaces: [],
    receptionOptions: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: session?.user?.id || ''
  }

  // Fusionne les données de la BDD avec les valeurs par défaut
  const storefrontFormData = storefront
    ? {
        ...defaultStorefront,
        ...storefront,
        venueLatitude: 'venueLatitude' in storefront && storefront.venueLatitude !== null ? storefront.venueLatitude : 48.8566,
        venueLongitude: 'venueLongitude' in storefront && storefront.venueLongitude !== null ? storefront.venueLongitude : 2.3522,
        interventionRadius: 'interventionRadius' in storefront && storefront.interventionRadius !== null ? storefront.interventionRadius : 50,
        receptionSpaces: 'receptionSpaces' in storefront ? (storefront as any).receptionSpaces : [],
        receptionOptions: 'receptionOptions' in storefront ? (storefront as any).receptionOptions : {},
      }
    : defaultStorefront;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{storefront ? 'Gérer votre vitrine' : 'Créer votre vitrine'}</CardTitle>
      </CardHeader>
      <CardContent>
        <StorefrontForm
          storefront={storefrontFormData}
        />
      </CardContent>
    </Card>
  )
}
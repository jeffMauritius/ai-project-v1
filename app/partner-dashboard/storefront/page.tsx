"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { StorefrontForm } from "../components/StorefrontForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { PartnerStorefront, ServiceType, VenueType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OptionsTab } from "../components/OptionsTab"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import dynamic from 'next/dynamic'

// Chargement dynamique du composant Map
const Map = dynamic(() => import('../../components/Map'), {
  ssr: false,
  loading: () => <div>Chargement de la carte...</div>,
})

// Chargement dynamique du composant MediaManager
const MediaManager = dynamic(() => import('../components/MediaManager'), {
  ssr: false,
  loading: () => <div>Chargement du gestionnaire de médias...</div>,
})



export default function PartnerStorefrontPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [storefront, setStorefront] = useState<PartnerStorefront | null>(null)
  const [partnerData, setPartnerData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  // Valeurs par défaut pour StorefrontForm
  const defaultStorefront = useMemo(() => ({
    id: '',
    companyName: partnerData?.user?.name || session?.user?.name || '',
    description: '',
    logo: null,
    isActive: false,
    serviceType: storefront?.serviceType || ServiceType.LIEU,
    venueType: VenueType.UNKNOWN,
    billingStreet: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: 'France',
    siret: partnerData?.storefront?.siret || '',
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
  }), [session?.user?.id, session?.user?.name, partnerData, storefront?.serviceType])

  // Fusionne les données de la BDD avec les valeurs par défaut
  const storefrontFormData = useMemo(() => {
    return storefront
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
  }, [storefront, defaultStorefront]);

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        // Récupérer les données du partenaire
        const partnerResponse = await fetch("/api/user/partner-data")
        if (partnerResponse.ok) {
          const partnerDataResult = await partnerResponse.json()
          setPartnerData(partnerDataResult)
        }

        // Récupérer les données de la vitrine
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

  const handleStorefrontUpdate = (updatedData: any) => {
    // Logique pour sauvegarder les données mises à jour
    console.log('Données mises à jour:', updatedData)
    setStorefront(updatedData)
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{storefront ? 'Gérer votre vitrine' : 'Créer votre vitrine'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="location">Localisation</TabsTrigger>
            <TabsTrigger value="media">Médias</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <StorefrontForm
              storefront={storefrontFormData}
            />
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Localisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="venueAddress">Adresse du lieu</Label>
                  <Input
                    id="venueAddress"
                    value={storefrontFormData.venueAddress || ''}
                    onChange={(e) => {
                      const updatedData = { ...storefrontFormData, venueAddress: e.target.value };
                      setStorefront(updatedData);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Zone d&apos;intervention</Label>
                  <RadioGroup
                    value={storefrontFormData.interventionType}
                    onValueChange={(value) => {
                      const updatedData = { ...storefrontFormData, interventionType: value };
                      setStorefront(updatedData);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all_france" id="all_france" />
                      <Label htmlFor="all_france">Toute la France</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="radius" id="radius" />
                      <Label htmlFor="radius">Rayon d&apos;intervention</Label>
                    </div>
                  </RadioGroup>
                </div>

                {storefrontFormData.interventionType === "radius" && (
                  <div className="space-y-2">
                    <Label htmlFor="interventionRadius">Rayon d&apos;intervention (km)</Label>
                    <Input
                      id="interventionRadius"
                      type="number"
                      value={storefrontFormData.interventionRadius}
                      onChange={(e) => {
                        const updatedData = { ...storefrontFormData, interventionRadius: parseInt(e.target.value) };
                        setStorefront(updatedData);
                      }}
                    />
                  </div>
                )}

                <div className="h-[400px]">
                  <Map
                    latitude={storefrontFormData.venueLatitude || 48.8566}
                    longitude={storefrontFormData.venueLongitude || 2.3522}
                    interventionType={storefrontFormData.interventionType}
                    interventionRadius={storefrontFormData.interventionRadius}
                    onLocationChange={(lat: number, lng: number) => {
                      const updatedData = { ...storefrontFormData, venueLatitude: lat, venueLongitude: lng };
                      setStorefront(updatedData);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Médias</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="options" className="space-y-6">
            <OptionsTab 
              storefrontData={storefrontFormData} 
              onUpdate={handleStorefrontUpdate} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
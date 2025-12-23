"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { StorefrontForm } from "../components/StorefrontForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ServiceType, VenueType } from '@prisma/client'
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
  // Le storefront inclut les données fusionnées du partenaire (billingStreet, latitude, etc.)
  const [storefront, setStorefront] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const router = useRouter()

  // Valeurs par défaut pour StorefrontForm
  const defaultStorefront = useMemo(() => ({
    id: '',
    companyName: session?.user?.name || '',
    description: '',
    logo: null,
    isActive: false,
    serviceType: ServiceType.LIEU,
    venueType: VenueType.UNKNOWN,
    billingStreet: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: 'France',
    siret: '',
    vatNumber: '',
    latitude: 48.8566,
    longitude: 2.3522,
    interventionType: 'all_france' as "all_france" | "radius",
    interventionRadius: 50,
    options: {},
    searchableOptions: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }), [session?.user?.name])

  // Utiliser directement les données du storefront si disponibles
  const storefrontFormData = useMemo(() => {
    return storefront || defaultStorefront;
  }, [storefront, defaultStorefront]);

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        console.log('[Page] Chargement des données du storefront...')
        
        // Récupérer les données de la vitrine (inclut les données du partenaire)
        const response = await fetch("/api/partner-storefront")
        if (response.ok) {
          const data = await response.json()
          if (data) {
            console.log('[Page] Données reçues:', data)
            setStorefront(data)
          }
        } else {
          console.error('[Page] Erreur API:', response.status)
          toast({
            title: "Erreur",
            description: "Impossible de charger les données de la vitrine.",
            variant: "destructive",
          })
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

  // Fonction pour géocoder une adresse en coordonnées
  const geocodeAddress = async (address: string) => {
    try {
      // Nettoyer l'adresse
      const cleanAddress = address.trim()
      if (!cleanAddress) {
        throw new Error('Adresse vide')
      }

      // Essayer plusieurs variantes de l'adresse
      const searchVariants = [
        cleanAddress,
        cleanAddress + ', France',
        cleanAddress + ', Paris, France',
        cleanAddress.replace(/\d+/, '') + ', France', // Sans numéro
        cleanAddress.split(' ').slice(0, 3).join(' ') + ', France' // Premiers mots
      ]

      let data = null
      let usedVariant = ''

      // Essayer chaque variante
      for (const variant of searchVariants) {
        try {
          // Essayer d'abord avec la recherche française
          let response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(variant)}&limit=5&countrycodes=fr&addressdetails=1`
          )
          
          if (!response.ok) {
            continue
          }
          
          data = await response.json()
          
          // Si pas de résultat en France, essayer sans restriction de pays
          if (!data || data.length === 0) {
            response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(variant)}&limit=5&addressdetails=1`
            )
            
            if (!response.ok) {
              continue
            }
            
            data = await response.json()
          }
          
          if (data && data.length > 0) {
            usedVariant = variant
            break
          }
        } catch (error) {
          console.error(`Erreur avec la variante "${variant}":`, error)
          continue
        }
        
        // Attendre un peu entre les requêtes pour respecter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      if (data && data.length > 0) {
        const result = data[0]
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
          usedVariant: usedVariant
        }
      } else {
        // Si aucune adresse trouvée, essayer avec une recherche plus large
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress.split(' ').slice(0, 2).join(' '))}&limit=1&countrycodes=fr`
        )
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          if (fallbackData && fallbackData.length > 0) {
            const result = fallbackData[0]
            return {
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon),
              displayName: result.display_name,
              usedVariant: 'recherche simplifiée'
            }
          }
        }
        
        throw new Error(`Aucune adresse trouvée pour: "${cleanAddress}". Essayez une adresse plus complète.`)
      }
    } catch (error) {
      console.error('Erreur de géocodification:', error)
      throw error
    }
  }

  const handleStorefrontUpdate = (updatedData: any) => {
    console.log('[Page] Données mises à jour:', updatedData)
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
              onUpdate={handleStorefrontUpdate}
            />
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Localisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Adresse (depuis l&apos;onglet Général)</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      {storefrontFormData.billingStreet || 'Adresse non renseignée'}
                      {storefrontFormData.billingCity && `, ${storefrontFormData.billingCity}`}
                      {storefrontFormData.billingPostalCode && ` ${storefrontFormData.billingPostalCode}`}
                      {storefrontFormData.billingCountry && `, ${storefrontFormData.billingCountry}`}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Modifiez l&apos;adresse dans l&apos;onglet &quot;Général&quot; pour mettre à jour la géolocalisation.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const fullAddress = [
                        storefrontFormData.billingStreet,
                        storefrontFormData.billingCity,
                        storefrontFormData.billingPostalCode,
                        storefrontFormData.billingCountry
                      ].filter(Boolean).join(', ')

                      if (!fullAddress || fullAddress.length < 5) {
                        toast({
                          title: "Adresse incomplète",
                          description: "Veuillez d'abord renseigner l'adresse dans l'onglet Général.",
                          variant: "destructive",
                        })
                        return
                      }

                      try {
                        const coords = await geocodeAddress(fullAddress)
                        const geocodedData = {
                          ...storefrontFormData,
                          latitude: coords.lat,
                          longitude: coords.lng
                        }
                        setStorefront(geocodedData)

                        toast({
                          title: "Coordonnées mises à jour",
                          description: `Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`,
                        })
                      } catch (error) {
                        console.error('Erreur lors de la géocodification:', error)
                        toast({
                          title: "Erreur de géolocalisation",
                          description: error instanceof Error ? error.message : "Impossible de géolocaliser l'adresse",
                          variant: "destructive",
                        })
                      }
                    }}
                    disabled={!storefrontFormData.billingStreet}
                  >
                    Géolocaliser l&apos;adresse
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Zone d&apos;intervention</Label>
                  <RadioGroup
                    value={storefrontFormData.interventionType}
                    onValueChange={(value) => setStorefront({
                      ...storefrontFormData,
                      interventionType: value as "all_france" | "radius"
                    })}
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
                      onChange={(e) => setStorefront({
                        ...storefrontFormData,
                        interventionRadius: parseInt(e.target.value) || 50
                      })}
                    />
                  </div>
                )}

                <div className="h-[400px]">
                  <Map
                    latitude={storefrontFormData.latitude || 48.8566}
                    longitude={storefrontFormData.longitude || 2.3522}
                    interventionType={storefrontFormData.interventionType}
                    interventionRadius={storefrontFormData.interventionRadius}
                    enableGeolocation={true}
                    onLocationChange={(lat: number, lng: number) => {
                      setStorefront({
                        ...storefrontFormData,
                        latitude: lat,
                        longitude: lng
                      })
                    }}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={async () => {
                      setIsSavingLocation(true)

                      try {
                        // Préparer les données de localisation pour l'API
                        const dataToSend = {
                          interventionType: storefrontFormData.interventionType as "all_france" | "radius",
                          interventionRadius: storefrontFormData.interventionRadius,
                          latitude: storefrontFormData.latitude,
                          longitude: storefrontFormData.longitude,
                        }

                        console.log("Envoi des données de localisation:", dataToSend)

                        const response = await fetch("/api/partner-storefront", {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify(dataToSend),
                        })

                        console.log("Statut de la réponse:", response.status)
                        const responseData = await response.json()
                        console.log("Données de la réponse:", responseData)

                        if (!response.ok) {
                          throw new Error(responseData.message || responseData || "Une erreur est survenue lors de la sauvegarde")
                        }

                        // Mettre à jour l'état local avec les nouvelles données
                        setStorefront(responseData)

                        toast({
                          title: "Succès",
                          description: "Informations de localisation sauvegardées",
                        })
                      } catch (error) {
                        console.error("Erreur lors de la sauvegarde:", error)
                        toast({
                          title: "Erreur",
                          description: error instanceof Error ? error.message : "Une erreur est survenue lors de la sauvegarde",
                          variant: "destructive",
                        })
                      } finally {
                        setIsSavingLocation(false)
                      }
                    }}
                    disabled={isSavingLocation}
                  >
                    {isSavingLocation ? 'Sauvegarde...' : 'Sauvegarder la localisation'}
                  </Button>
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
                <MediaManager storefrontId={storefrontFormData.id} />
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
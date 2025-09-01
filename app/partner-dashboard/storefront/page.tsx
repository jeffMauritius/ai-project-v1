"use client"

import { useEffect, useState, useMemo, useRef } from "react"
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
import { z } from 'zod'

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

// Schémas de validation Zod
const locationSchema = z.object({
  venueAddress: z.string().min(1, "L'adresse du lieu est requise").max(200, "L'adresse ne peut pas dépasser 200 caractères"),
  interventionType: z.enum(["all_france", "radius"], {
    errorMap: () => ({ message: "Veuillez sélectionner un type d'intervention valide" })
  }),
  interventionRadius: z.number().min(1, "Le rayon d'intervention doit être supérieur à 0").max(1000, "Le rayon d'intervention ne peut pas dépasser 1000 km"),
  venueLatitude: z.number().min(-90).max(90),
  venueLongitude: z.number().min(-180).max(180),
}).refine((data) => {
  if (data.interventionType === "radius") {
    return data.interventionRadius > 0 && data.interventionRadius <= 1000
  }
  return true
}, {
  message: "Le rayon d'intervention est requis quand le type est 'rayon d'intervention'",
  path: ["interventionRadius"]
})

type LocationFormData = z.infer<typeof locationSchema>



export default function PartnerStorefrontPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [storefront, setStorefront] = useState<PartnerStorefront | null>(null)
  const [partnerData, setPartnerData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [locationErrors, setLocationErrors] = useState<Record<string, string>>({})
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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
    venueAddress: null,
    venueLatitude: 48.8566,
    venueLongitude: 2.3522,
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

    // Nettoyer le timeout lors du démontage
    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current)
      }
    }
  }, [session, toast])

  // Fonction de validation pour la section localisation
  const validateLocation = (data: LocationFormData) => {
    try {
      locationSchema.parse(data)
      setLocationErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setLocationErrors(newErrors)
      }
      return false
    }
  }

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

  // Fonction pour gérer les changements de champs de localisation avec validation
  const handleLocationFieldChange = async (field: keyof LocationFormData, value: any) => {
    // Mettre à jour les données d'abord
    const updatedData = { ...storefrontFormData, [field]: value }
    setStorefront(updatedData)
    
    // Validation en temps réel pour le champ modifié
    try {
      // Validation simple du champ individuel
      if (field === 'venueAddress') {
        if (value.length === 0) {
          setLocationErrors(prev => ({ ...prev, [field]: "L'adresse du lieu est requise" }))
        } else if (value.length > 200) {
          setLocationErrors(prev => ({ ...prev, [field]: "L'adresse ne peut pas dépasser 200 caractères" }))
        } else {
          setLocationErrors(prev => ({ ...prev, [field]: '' }))
          
          // Géocoder l'adresse si elle fait plus de 5 caractères avec debounce
          if (value.length > 5) {
            // Annuler le timeout précédent
            if (geocodingTimeoutRef.current) {
              clearTimeout(geocodingTimeoutRef.current)
            }
            
            // Définir un nouveau timeout pour éviter trop d'appels API
            geocodingTimeoutRef.current = setTimeout(async () => {
              try {
                const coords = await geocodeAddress(value)
                // Mettre à jour les coordonnées automatiquement
                const geocodedData = { 
                  ...storefrontFormData, 
                  [field]: value,
                  venueLatitude: coords.lat,
                  venueLongitude: coords.lng
                }
                setStorefront(geocodedData)
                
                // Effacer les erreurs de coordonnées
                setLocationErrors(prev => ({ 
                  ...prev, 
                  venueLatitude: '',
                  venueLongitude: ''
                }))
                
                toast({
                  title: "Coordonnées mises à jour",
                  description: `${coords.displayName || 'Adresse trouvée'} - Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}${coords.usedVariant ? ` (via: ${coords.usedVariant})` : ''}`,
                })
              } catch (error) {
                console.error('Erreur lors de la géocodification:', error)
                // Ne pas afficher d'erreur à l'utilisateur pour la géocodification automatique
              }
            }, 1500) // Attendre 1.5 secondes après la dernière frappe pour respecter le rate limiting
          }
        }
      } else if (field === 'interventionType') {
        if (value !== 'all_france' && value !== 'radius') {
          setLocationErrors(prev => ({ ...prev, [field]: "Veuillez sélectionner un type d'intervention valide" }))
        } else {
          setLocationErrors(prev => ({ ...prev, [field]: '' }))
        }
      } else if (field === 'interventionRadius') {
        if (value < 1 || value > 1000) {
          setLocationErrors(prev => ({ ...prev, [field]: "Le rayon d'intervention doit être entre 1 et 1000 km" }))
        } else {
          setLocationErrors(prev => ({ ...prev, [field]: '' }))
        }
      } else if (field === 'venueLatitude') {
        if (value < -90 || value > 90) {
          setLocationErrors(prev => ({ ...prev, [field]: "La latitude doit être entre -90 et 90" }))
        } else {
          setLocationErrors(prev => ({ ...prev, [field]: '' }))
        }
      } else if (field === 'venueLongitude') {
        if (value < -180 || value > 180) {
          setLocationErrors(prev => ({ ...prev, [field]: "La longitude doit être entre -180 et 180" }))
        } else {
          setLocationErrors(prev => ({ ...prev, [field]: '' }))
        }
      }
    } catch (error) {
      console.error('Erreur de validation:', error)
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
                  <Label htmlFor="venueAddress">Adresse du lieu</Label>
                  <Input
                    id="venueAddress"
                    value={storefrontFormData.venueAddress || ''}
                    onChange={(e) => handleLocationFieldChange('venueAddress', e.target.value)}
                    className={locationErrors.venueAddress ? 'border-red-500' : ''}
                    placeholder="Entrez l'adresse complète..."
                  />
                  {locationErrors.venueAddress && (
                    <p className="text-sm text-red-500">{locationErrors.venueAddress}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Les coordonnées se mettent à jour automatiquement. Format recommandé: &quot;123 Rue de la Paix, 75001 Paris, France&quot;
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Zone d&apos;intervention</Label>
                  <RadioGroup
                    value={storefrontFormData.interventionType}
                    onValueChange={(value) => handleLocationFieldChange('interventionType', value as "all_france" | "radius")}
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
                  {locationErrors.interventionType && (
                    <p className="text-sm text-red-500">{locationErrors.interventionType}</p>
                  )}
                </div>

                {storefrontFormData.interventionType === "radius" && (
                  <div className="space-y-2">
                    <Label htmlFor="interventionRadius">Rayon d&apos;intervention (km)</Label>
                    <Input
                      id="interventionRadius"
                      type="number"
                      value={storefrontFormData.interventionRadius}
                      onChange={(e) => handleLocationFieldChange('interventionRadius', parseInt(e.target.value))}
                      className={locationErrors.interventionRadius ? 'border-red-500' : ''}
                    />
                    {locationErrors.interventionRadius && (
                      <p className="text-sm text-red-500">{locationErrors.interventionRadius}</p>
                    )}
                  </div>
                )}

                <div className="h-[400px]">
                  <Map
                    latitude={storefrontFormData.venueLatitude || 48.8566}
                    longitude={storefrontFormData.venueLongitude || 2.3522}
                    interventionType={storefrontFormData.interventionType}
                    interventionRadius={storefrontFormData.interventionRadius}
                    enableGeolocation={true}
                    onLocationChange={(lat: number, lng: number) => {
                      handleLocationFieldChange('venueLatitude', lat)
                      handleLocationFieldChange('venueLongitude', lng)
                    }}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={async () => {
                      setIsSavingLocation(true)
                      
                      const locationData: LocationFormData = {
                        venueAddress: storefrontFormData.venueAddress || '',
                        interventionType: storefrontFormData.interventionType as "all_france" | "radius",
                        interventionRadius: storefrontFormData.interventionRadius,
                        venueLatitude: storefrontFormData.venueLatitude,
                        venueLongitude: storefrontFormData.venueLongitude,
                      }
                      
                      if (!validateLocation(locationData)) {
                        toast({
                          title: "Erreur de validation",
                          description: "Veuillez corriger les erreurs dans le formulaire",
                          variant: "destructive",
                        })
                        setIsSavingLocation(false)
                        return
                      }

                      try {
                        // Préparer les données complètes pour l'API
                        const dataToSend = {
                          ...storefrontFormData,
                          venueAddress: locationData.venueAddress,
                          interventionType: locationData.interventionType as "all_france" | "radius",
                          interventionRadius: locationData.interventionRadius,
                          venueLatitude: locationData.venueLatitude,
                          venueLongitude: locationData.venueLongitude,
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
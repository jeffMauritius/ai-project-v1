"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Editor } from "@tinymce/tinymce-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Chargement dynamique de Leaflet uniquement côté client
const L = dynamic(() => import("leaflet"), {
  ssr: false,
  loading: () => <div>Chargement de la carte...</div>,
}) as any

// Chargement dynamique du composant Map
const Map = dynamic(() => import("../../components/Map"), {
  ssr: false,
  loading: () => <div>Chargement de la carte...</div>,
})

interface StorefrontData {
  companyName: string
  description: string
  logo: string
  isActive: boolean
  serviceType: string
  venueType: string
  billingStreet: string
  billingCity: string
  billingPostalCode: string
  billingCountry: string
  siret: string
  vatNumber: string
  venueAddress: string
  venueLatitude: number
  venueLongitude: number
  interventionType: string
  interventionRadius: number
}

export default function PartnerStorefrontPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [marker, setMarker] = useState<L.Marker | null>(null)
  const [circle, setCircle] = useState<L.Circle | null>(null)
  const [storefrontData, setStorefrontData] = useState<StorefrontData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    companyName: "",
    description: "",
    logo: "",
    isActive: false,
    serviceType: "LIEU" as const,
    venueType: "UNKNOWN" as const,
    billingStreet: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "",
    siret: "",
    vatNumber: "",
    venueAddress: "",
    venueLatitude: 0,
    venueLongitude: 0,
    interventionType: "all_france",
    interventionRadius: 50,
  })

  useEffect(() => {
    if (session?.user?.role === "PARTNER" && mapRef.current) {
      // Initialiser la carte
      const mapInstance = L.map(mapRef.current).setView([48.8566, 2.3522], 12) // Paris par défaut
      
      // Ajouter le fond de carte OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance)

      setMap(mapInstance)

      // Nettoyer la carte lors du démontage du composant
      return () => {
        mapInstance.remove()
      }
    }
  }, [session])

  // Charger les données de la vitrine
  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        const response = await fetch("/api/partner-storefront")
        if (response.ok) {
          const data = await response.json()
          if (data) {
            setStorefrontData(data)
            // Initialiser le formulaire avec les données
            setFormData({
              companyName: data.companyName || "",
              description: data.description || "",
              logo: data.logo || "",
              isActive: data.isActive || false,
              serviceType: data.serviceType || "LIEU",
              venueType: data.venueType || "UNKNOWN",
              billingStreet: data.billingStreet || "",
              billingCity: data.billingCity || "",
              billingPostalCode: data.billingPostalCode || "",
              billingCountry: data.billingCountry || "",
              siret: data.siret || "",
              vatNumber: data.vatNumber || "",
              venueAddress: data.venueAddress || "",
              venueLatitude: data.venueLatitude || 0,
              venueLongitude: data.venueLongitude || 0,
              interventionType: data.interventionType || "all_france",
              interventionRadius: data.interventionRadius || 50,
            })
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de la vitrine.",
          variant: "destructive",
        })
      }
    }

    if (session?.user?.role === "PARTNER") {
      fetchStorefrontData()
    }
  }, [session, toast])

  // Effet séparé pour mettre à jour la carte
  useEffect(() => {
    if (storefrontData?.venueLatitude && storefrontData?.venueLongitude && map) {
      // Mettre à jour le marqueur
      if (marker) {
        marker.remove()
      }
      const newMarker = L.marker([storefrontData.venueLatitude, storefrontData.venueLongitude]).addTo(map)
      setMarker(newMarker)
      map.setView([storefrontData.venueLatitude, storefrontData.venueLongitude], 15)

      // Mettre à jour le cercle si le type d'intervention est "radius"
      if (storefrontData.interventionType === "radius") {
        if (circle) {
          circle.remove()
        }
        const newCircle = L.circle(
          [storefrontData.venueLatitude, storefrontData.venueLongitude],
          {
            radius: storefrontData.interventionRadius * 1000,
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.2,
            weight: 2,
          }
        ).addTo(map)
        setCircle(newCircle)
      }
    }
  }, [storefrontData, map])

  const handleLocationChange = (lat: number, lng: number) => {
    setStorefrontData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        venueLatitude: lat,
        venueLongitude: lng,
      }
    })
  }

  const handleInterventionTypeChange = (value: string) => {
    setStorefrontData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        interventionType: value,
      }
    })
    
    // Supprimer le cercle si on passe à "Toute la France"
    if (value === "all_france" && circle && map) {
      circle.remove()
      setCircle(null)
    }
  }

  const handleRadiusChange = (value: string) => {
    setStorefrontData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        interventionRadius: parseInt(value),
      }
    })

    // Mettre à jour le cercle sur la carte
    if (storefrontData?.interventionType === "radius" && 
        storefrontData?.venueLatitude && 
        storefrontData?.venueLongitude && 
        map) {
      if (circle) {
        circle.remove()
      }
      const newCircle = L.circle(
        [storefrontData.venueLatitude, storefrontData.venueLongitude],
        {
          radius: parseInt(value) * 1000, // Conversion en mètres
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
          weight: 2,
        }
      ).addTo(map)
      setCircle(newCircle)
    }
  }

  const handleAddressSearch = async (address: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      )
      const data = await response.json()

      if (data && data[0]) {
        const { lat, lon } = data[0]
        
        // Mettre à jour les coordonnées
        setStorefrontData((prev: StorefrontData) => ({
          ...prev,
          venueLatitude: lat,
          venueLongitude: lon,
        }))

        // Mettre à jour le marqueur sur la carte
        if (map) {
          if (marker) {
            marker.remove()
          }
          const newMarker = L.marker([lat, lon]).addTo(map)
          setMarker(newMarker)
          map.setView([lat, lon], 15)

          // Mettre à jour le cercle si le type d'intervention est "radius"
          if (storefrontData.interventionType === "radius") {
            if (circle) {
              circle.remove()
            }
            const newCircle = L.circle(
              [lat, lon],
              {
                radius: parseInt(storefrontData.interventionRadius) * 1000,
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.2,
                weight: 2,
              }
            ).addTo(map)
            setCircle(newCircle)
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la recherche d'adresse:", error)
      toast({
        title: "Erreur",
        description: "Impossible de trouver l'adresse.",
        variant: "destructive",
      })
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Le fichier doit être une image.",
          variant: "destructive",
        })
        return
      }

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "L'image ne doit pas dépasser 5MB.",
          variant: "destructive",
        })
        return
      }

      // Créer l'URL de prévisualisation
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
        setStorefrontData((prev: StorefrontData) => ({
          ...prev,
          logo: file.name
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setStorefrontData((prev: StorefrontData) => ({
      ...prev,
      logo: ""
    }))
    if (logoInputRef.current) {
      logoInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/partner-storefront", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          venueLatitude: formData.venueLatitude ? parseFloat(formData.venueLatitude.toString()) : null,
          venueLongitude: formData.venueLongitude ? parseFloat(formData.venueLongitude.toString()) : null,
          interventionRadius: formData.interventionType === "radius" ? parseInt(formData.interventionRadius.toString()) : null,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur de réponse:", errorText)
        throw new Error(`Erreur lors de la mise à jour: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      setStorefrontData(data) // Mettre à jour storefrontData avec les nouvelles données
      toast({
        title: "Succès",
        description: "Les informations ont été mises à jour avec succès.",
      })
      console.log("Vitrine mise à jour:", data)
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      })
    }
  }

  // Fonction de test pour créer une vitrine
  const testCreateStorefront = async () => {
    try {
      const testData = {
        companyName: "Test Company",
        description: "Test Description",
        logo: "test-logo.png",
        isActive: true,
        serviceType: "LIEU",
        venueType: "UNKNOWN",
        billingStreet: "123 Test St",
        billingCity: "Test City",
        billingPostalCode: "75000",
        billingCountry: "France",
        siret: "12345678901234",
        vatNumber: "FR12345678900",
        venueAddress: "123 Test St, Test City",
        venueLatitude: 48.8566,
        venueLongitude: 2.3522,
        interventionType: "radius",
        interventionRadius: 50,
      }

      const response = await fetch("/api/partner-storefront", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(testData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur de réponse:", errorText)
        throw new Error(`Erreur lors de la création: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      toast({
        title: "Succès",
        description: "Vitrine créée avec succès",
      })
      console.log("Vitrine créée:", data)
    } catch (error) {
      console.error("Erreur lors de la création:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création de la vitrine",
        variant: "destructive",
      })
    }
  }

  // Fonction de test pour lire une vitrine
  const testReadStorefront = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/partner-storefront", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la lecture")
      }

      const data = await response.json()
      setStorefrontData(data)
      toast({
        title: "Succès",
        description: "Données de la vitrine récupérées avec succès",
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la lecture des données",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction de test pour mettre à jour une vitrine
  const testUpdateStorefront = async () => {
    try {
      const testData = {
        companyName: "Updated Company",
        description: "Updated Description",
        logo: "updated-logo.png",
        isActive: true,
        serviceType: "LIEU",
        venueType: "UNKNOWN",
        billingStreet: "456 Updated St",
        billingCity: "Updated City",
        billingPostalCode: "75001",
        billingCountry: "France",
        siret: "98765432109876",
        vatNumber: "FR98765432100",
        venueAddress: "456 Updated St, Updated City",
        venueLatitude: 48.8566,
        venueLongitude: 2.3522,
        interventionType: "radius",
        interventionRadius: 100,
      }

      const response = await fetch("/api/partner-storefront", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(testData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur de réponse:", errorText)
        throw new Error(`Erreur lors de la mise à jour: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      toast({
        title: "Succès",
        description: "Vitrine mise à jour avec succès",
      })
      console.log("Vitrine mise à jour:", data)
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour de la vitrine",
        variant: "destructive",
      })
    }
  }

  // Fonction de test pour créer un utilisateur partenaire
  const testCreatePartner = async () => {
    try {
      const response = await fetch("/api/test/create-partner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur de réponse:", errorText)
        throw new Error(`Erreur lors de la création du partenaire: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      toast({
        title: "Succès",
        description: "Partenaire créé avec succès",
      })
      console.log("Partenaire créé:", data)
    } catch (error) {
      console.error("Erreur lors de la création du partenaire:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création du partenaire",
        variant: "destructive",
      })
    }
  }

  const testResetDb = async () => {
    try {
      const response = await fetch("/api/test/reset-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la réinitialisation")
      }

      toast({
        title: "Succès",
        description: "Base de données réinitialisée avec succès",
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la réinitialisation",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Configuration de la Vitrine</h1>
        <div className="space-x-2">
          <Button onClick={testResetDb} variant="destructive" size="sm">
            Réinitialiser DB
          </Button>
          <Button onClick={testCreatePartner} size="sm">
            Test Création Partenaire
          </Button>
          <Button onClick={testCreateStorefront} size="sm">
            Test Création Vitrine
          </Button>
          <Button onClick={testReadStorefront} size="sm">
            Test Lecture Vitrine
          </Button>
          <Button onClick={testUpdateStorefront} size="sm">
            Test Mise à jour Vitrine
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      <Tabs defaultValue="informations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="media">Photos et médias</TabsTrigger>
          <TabsTrigger value="divers">Divers</TabsTrigger>
        </TabsList>

        <TabsContent value="informations">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de l'entreprise */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de l&apos;entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceType">Type de service</Label>
                    <Select
                      value={formData.serviceType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, serviceType: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type de service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LIEU">Lieu de réception</SelectItem>
                        <SelectItem value="TRAITEUR">Traiteur</SelectItem>
                        <SelectItem value="FAIRE_PART">Faire-part</SelectItem>
                        <SelectItem value="CADEAUX_INVITES">Cadeaux invités</SelectItem>
                        <SelectItem value="PHOTOGRAPHE">Photographe</SelectItem>
                        <SelectItem value="MUSIQUE">Musique</SelectItem>
                        <SelectItem value="VOITURE">Voiture</SelectItem>
                        <SelectItem value="BUS">Bus</SelectItem>
                        <SelectItem value="DECORATION">Décoration</SelectItem>
                        <SelectItem value="CHAPITEAU">Chapiteau</SelectItem>
                        <SelectItem value="ANIMATION">Animation</SelectItem>
                        <SelectItem value="FLORISTE">Floriste</SelectItem>
                        <SelectItem value="LISTE">Liste</SelectItem>
                        <SelectItem value="ORGANISATION">Organisation</SelectItem>
                        <SelectItem value="VIDEO">Vidéo</SelectItem>
                        <SelectItem value="LUNE_DE_MIEL">Lune de miel</SelectItem>
                        <SelectItem value="WEDDING_CAKE">Wedding cake</SelectItem>
                        <SelectItem value="OFFICIANT">Officiant</SelectItem>
                        <SelectItem value="FOOD_TRUCK">Food truck</SelectItem>
                        <SelectItem value="VIN">Vin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.serviceType === "LIEU" && (
                    <div>
                      <Label htmlFor="venueType">Type de lieu</Label>
                      <Select
                        value={formData.venueType}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, venueType: value as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type de lieu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DOMAINE">Domaine</SelectItem>
                          <SelectItem value="AUBERGE">Auberge</SelectItem>
                          <SelectItem value="HOTEL">Hôtel</SelectItem>
                          <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                          <SelectItem value="SALLE_DE_RECEPTION">Salle de réception</SelectItem>
                          <SelectItem value="CHATEAU">Château</SelectItem>
                          <SelectItem value="BATEAU">Bateau</SelectItem>
                          <SelectItem value="PLAGE">Plage</SelectItem>
                          <SelectItem value="UNKNOWN">Inconnu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Editor
                      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                      value={formData.description}
                      onEditorChange={(content: string) =>
                        setFormData({ ...formData, description: content })
                      }
                      init={{
                        height: 300,
                        menubar: false,
                        plugins: [
                          "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
                          "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
                          "insertdatetime", "media", "table", "code", "help", "wordcount"
                        ],
                        toolbar: "undo redo | blocks | " +
                          "bold italic forecolor | alignleft aligncenter " +
                          "alignright alignjustify | bullist numlist outdent indent | " +
                          "removeformat | help",
                        content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }"
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        ref={logoInputRef}
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="flex-1"
                      />
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveLogo}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                    {logoPreview && (
                      <div className="mt-2">
                        <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formData.logo}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                    <Label htmlFor="isActive">Vitrine active</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations de facturation */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de facturation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="billingStreet">Adresse de facturation</Label>
                    <Input
                      id="billingStreet"
                      value={formData.billingStreet}
                      onChange={(e) =>
                        setFormData({ ...formData, billingStreet: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingCity">Ville</Label>
                      <Input
                        id="billingCity"
                        value={formData.billingCity}
                        onChange={(e) =>
                          setFormData({ ...formData, billingCity: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingPostalCode">Code postal</Label>
                      <Input
                        id="billingPostalCode"
                        value={formData.billingPostalCode}
                        onChange={(e) =>
                          setFormData({ ...formData, billingPostalCode: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="billingCountry">Pays</Label>
                    <Input
                      id="billingCountry"
                      value={formData.billingCountry}
                      onChange={(e) =>
                        setFormData({ ...formData, billingCountry: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="siret">Numéro SIRET</Label>
                      <Input
                        id="siret"
                        value={formData.siret}
                        onChange={(e) =>
                          setFormData({ ...formData, siret: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="vatNumber">Numéro de TVA</Label>
                      <Input
                        id="vatNumber"
                        value={formData.vatNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, vatNumber: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adresse du lieu et zone d'intervention */}
            {session?.user?.role === "PARTNER" && (
              <Card>
                <CardHeader>
                  <CardTitle>Adresse du lieu et zone d&apos;intervention</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="venueAddress">Adresse du lieu</Label>
                      <Input
                        id="venueAddress"
                        value={formData.venueAddress}
                        onChange={(e) =>
                          setFormData({ ...formData, venueAddress: e.target.value })
                        }
                        onBlur={(e) => handleAddressSearch(e.target.value)}
                        placeholder="Entrez l'adresse complète..."
                      />
                    </div>
                    {storefrontData && (
                      <Map
                        latitude={storefrontData.venueLatitude}
                        longitude={storefrontData.venueLongitude}
                        interventionType={storefrontData.interventionType}
                        interventionRadius={storefrontData.interventionRadius}
                        onLocationChange={handleLocationChange}
                      />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="venueLatitude">Latitude</Label>
                        <Input
                          id="venueLatitude"
                          type="number"
                          step="any"
                          value={formData.venueLatitude.toString()}
                          onChange={(e) =>
                            setFormData({ ...formData, venueLatitude: parseFloat(e.target.value) })
                          }
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="venueLongitude">Longitude</Label>
                        <Input
                          id="venueLongitude"
                          type="number"
                          step="any"
                          value={formData.venueLongitude.toString()}
                          onChange={(e) =>
                            setFormData({ ...formData, venueLongitude: parseFloat(e.target.value) })
                          }
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Zone d'intervention */}
                    <div className="space-y-4">
                      <Label>Zone d&apos;intervention</Label>
                      <RadioGroup
                        value={formData.interventionType}
                        onValueChange={handleInterventionTypeChange}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all_france" id="all_france" />
                          <Label htmlFor="all_france">Toute la France</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="radius" id="radius" />
                          <Label htmlFor="radius">Rayon autour de l&apos;adresse</Label>
                        </div>
                      </RadioGroup>

                      {formData.interventionType === "radius" && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="1"
                            max="500"
                            value={formData.interventionRadius.toString()}
                            onChange={(e) => handleRadiusChange(e.target.value)}
                            className="w-24"
                          />
                          <Label>km</Label>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit">Enregistrer les modifications</Button>
          </form>
        </TabsContent>

        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle>Options du partenaire</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Bienvenue dans la section des options. Cette section permettra de configurer toutes les options spécifiques au partenaire.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Photos et médias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Bienvenue dans la section des photos et médias. Cette section permettra de gérer toutes les photos et vidéos de la vitrine.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="divers">
          <Card>
            <CardHeader>
              <CardTitle>Informations diverses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Bienvenue dans la section des informations diverses. Cette section contiendra des informations supplémentaires sur la vitrine.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
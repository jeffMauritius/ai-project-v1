"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Editor } from '@tinymce/tinymce-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { ServiceType, VenueType } from '@prisma/client'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'

// Chargement dynamique du composant Map
const Map = dynamic(() => import('../../components/Map'), {
  ssr: false,
  loading: () => <div>Chargement de la carte...</div>,
})

interface StorefrontFormProps {
  storefront: {
    id: string
    companyName: string
    description: string
    logo: string | null
    isActive: boolean
    serviceType: ServiceType
    venueType: VenueType | null
    billingStreet: string
    billingCity: string
    billingPostalCode: string
    billingCountry: string
    siret: string
    vatNumber: string
    venueAddress: string | null
    venueLatitude: number
    venueLongitude: number
    interventionType: string
    interventionRadius: number
    receptionSpaces: any[]
    receptionOptions: any
    createdAt: Date
    updatedAt: Date
    userId: string
  }
}

export function StorefrontForm({ storefront }: StorefrontFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    ...storefront,
    venueLatitude: storefront.venueLatitude || 48.8566,
    venueLongitude: storefront.venueLongitude || 2.3522,
    interventionRadius: storefront.interventionRadius || 50,
    interventionType: storefront.interventionType || 'all_france',
    venueType: storefront.venueType || VenueType.UNKNOWN,
    venueAddress: storefront.venueAddress || '',
    isActive: storefront.isActive || false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("TinyMCE API KEY:", process.env.NEXT_PUBLIC_TINY_MCE_API_KEY)
    }
  }, [])

  console.log('[StorefrontForm] Storefront reçu:', storefront)
  console.log('[StorefrontForm] Type de service:', storefront.serviceType)
  console.log('[StorefrontForm] Options de réception:', storefront.receptionOptions)
  console.log('[StorefrontForm] Espaces de réception:', storefront.receptionSpaces)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation côté client pour le numéro de TVA
      if (!formData.vatNumber || formData.vatNumber.trim().length === 0) {
        toast({
          title: "Erreur",
          description: "Le numéro de TVA est requis.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      console.log("[StorefrontForm] Début de la soumission")
      console.log("[StorefrontForm] Données du formulaire:", formData)

      const dataToSend = {
        ...formData,
        serviceType: formData.serviceType as ServiceType,
        venueType: formData.venueType as VenueType,
        venueLatitude: Number(formData.venueLatitude),
        venueLongitude: Number(formData.venueLongitude),
        interventionRadius: Number(formData.interventionRadius),
        venueAddress: formData.venueAddress ? formData.venueAddress : '',
        logo: formData.logo ? formData.logo : '',
        vatNumber: formData.vatNumber ? formData.vatNumber : '',
        isActive: formData.isActive,
      }

      console.log("[StorefrontForm] Données préparées pour l'envoi:", dataToSend)

      const response = await fetch("/api/partner-storefront", {
        method: storefront.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      console.log("[StorefrontForm] Statut de la réponse:", response.status)
      console.log("[StorefrontForm] En-têtes de la réponse:", Object.fromEntries(response.headers.entries()))

      const responseData = await response.json()
      console.log("[StorefrontForm] Données de la réponse:", responseData)

      if (!response.ok) {
        throw new Error(responseData.message || "Une erreur est survenue lors de la connexion")
      }

      toast({
        title: "Succès",
        description: "Vitrine sauvegardée avec succès",
      })

      if (!storefront.id) {
        router.refresh()
      }
    } catch (error) {
      console.error("[StorefrontForm] Erreur détaillée:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            {typeof window !== 'undefined' && (
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINY_MCE_API_KEY || ''}
                value={formData.description}
                onEditorChange={(content) => setFormData({ ...formData, description: content })}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Type de service</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value: ServiceType) => setFormData({ ...formData, serviceType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type de service" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ServiceType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.serviceType === 'LIEU' && (
            <div className="space-y-2">
              <Label htmlFor="venueType">Type de lieu</Label>
              <Select
                value={formData.venueType || 'UNKNOWN'}
                onValueChange={(value: VenueType) => setFormData({ ...formData, venueType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type de lieu" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(VenueType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Vitrine active</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations de facturation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billingStreet">Adresse de facturation</Label>
            <Input
              id="billingStreet"
              value={formData.billingStreet}
              onChange={(e) => setFormData({ ...formData, billingStreet: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingCity">Ville</Label>
              <Input
                id="billingCity"
                value={formData.billingCity}
                onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingPostalCode">Code postal</Label>
              <Input
                id="billingPostalCode"
                value={formData.billingPostalCode}
                onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingCountry">Pays</Label>
            <Input
              id="billingCountry"
              value={formData.billingCountry}
              onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siret">Numéro SIRET</Label>
              <Input
                id="siret"
                value={formData.siret}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">Numéro de TVA</Label>
              <Input
                id="vatNumber"
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  )
} 
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { z } from 'zod'
import { ServiceType, VenueType } from '@prisma/client'
import { useRouter } from 'next/navigation'

// Schéma de validation Zod
const storefrontFormSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis").max(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(2000, "La description ne peut pas dépasser 2000 caractères"),
  serviceType: z.nativeEnum(ServiceType, {
    errorMap: () => ({ message: "Veuillez sélectionner un type de service valide" })
  }),
  venueType: z.nativeEnum(VenueType).nullable(),
  billingStreet: z.string().min(1, "L'adresse de facturation est requise").max(200, "L'adresse de facturation ne peut pas dépasser 200 caractères"),
  billingCity: z.string().min(1, "La ville est requise").max(100, "La ville ne peut pas dépasser 100 caractères"),
  billingPostalCode: z.string().min(1, "Le code postal est requis").regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
  billingCountry: z.string().min(1, "Le pays est requis").max(100, "Le pays ne peut pas dépasser 100 caractères"),
  siret: z.string().min(1, "Le numéro SIRET est requis").regex(/^\d{14}$/, "Le numéro SIRET doit contenir exactement 14 chiffres"),
  vatNumber: z.string().min(1, "Le numéro de TVA est requis").regex(/^[A-Z]{2}[0-9A-Z]+$/, "Le numéro de TVA doit commencer par 2 lettres majuscules suivies de chiffres et lettres"),
  venueAddress: z.string().nullable(),
  venueLatitude: z.number().min(-90).max(90),
  venueLongitude: z.number().min(-180).max(180),
  interventionType: z.string().min(1, "Le type d'intervention est requis"),
  interventionRadius: z.number().min(1, "Le rayon d'intervention doit être supérieur à 0").max(1000, "Le rayon d'intervention ne peut pas dépasser 1000 km"),
  isActive: z.boolean(),
  logo: z.string().nullable(),
  id: z.string().optional(),
})

type StorefrontFormData = z.infer<typeof storefrontFormSchema>

interface StorefrontFormProps {
  storefront: StorefrontFormData
  onUpdate?: (updatedData: any) => void
}

export function StorefrontForm({ storefront, onUpdate }: StorefrontFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [formData, setFormData] = useState<StorefrontFormData>({
    ...storefront,
    venueLatitude: storefront.venueLatitude || 48.8566,
    venueLongitude: storefront.venueLongitude || 2.3522,
    interventionRadius: storefront.interventionRadius || 50,
    interventionType: storefront.interventionType || 'all_france',
    venueType: storefront.venueType || VenueType.UNKNOWN,
    venueAddress: storefront.venueAddress || '',
    isActive: storefront.isActive || false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Pré-remplir les données avec celles de la session si elles sont vides
  useEffect(() => {
    if (session?.user && (!formData.companyName || !formData.siret)) {
      setFormData(prev => ({
        ...prev,
        companyName: prev.companyName || session.user.name || '',
        siret: prev.siret || '',
        // Le type de service est déjà défini dans storefront.serviceType
      }))
    }
  }, [session, formData.companyName, formData.siret])



  // Fonction de validation avec Zod
  const validateForm = (data: StorefrontFormData) => {
    try {
      storefrontFormSchema.parse(data)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  // Fonction pour gérer les changements de champs avec validation
  const handleFieldChange = (field: keyof StorefrontFormData, value: any) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    
    // Validation en temps réel pour le champ modifié
    try {
      const fieldSchema = storefrontFormSchema.shape[field as keyof typeof storefrontFormSchema.shape]
      if (fieldSchema) {
        fieldSchema.parse(value)
        setErrors(prev => ({ ...prev, [field]: '' }))
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path[0] === field)
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }))
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validation avec Zod
    if (!validateForm(formData)) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const dataToSend = {
        companyName: formData.companyName,
        description: formData.description,
        serviceType: formData.serviceType as ServiceType,
        venueType: formData.serviceType !== ServiceType.LIEU ? VenueType.UNKNOWN : formData.venueType as VenueType,
        billingStreet: formData.billingStreet,
        billingCity: formData.billingCity,
        billingPostalCode: formData.billingPostalCode,
        billingCountry: formData.billingCountry,
        siret: formData.siret,
        vatNumber: formData.vatNumber,
        venueAddress: formData.venueAddress || '',
        venueLatitude: Number(formData.venueLatitude),
        venueLongitude: Number(formData.venueLongitude),
        interventionType: formData.interventionType,
        interventionRadius: Number(formData.interventionRadius),
        logo: formData.logo || '',
        isActive: formData.isActive,
        ...(formData.id && { id: formData.id }),
      }

      console.log("Données envoyées:", dataToSend)
      console.log("Méthode:", storefront.id ? "PUT" : "POST")

      const response = await fetch("/api/partner-storefront", {
        method: storefront.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      console.log("Statut de la réponse:", response.status)
      const responseData = await response.json()
      console.log("Données de la réponse:", responseData)

      if (!response.ok) {
        throw new Error(responseData.message || responseData || "Une erreur est survenue lors de la connexion")
      }

      // Appeler le callback pour informer le parent
      if (onUpdate) {
        onUpdate(responseData)
      }

      toast({
        title: "Succès",
        description: "Vitrine sauvegardée avec succès",
      })

      if (!storefront.id) {
        router.refresh()
      }
    } catch (error) {
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
              onChange={(e) => handleFieldChange('companyName', e.target.value)}
              className={errors.companyName ? 'border-red-500' : ''}
            />
            {errors.companyName && (
              <p className="text-sm text-red-500">{errors.companyName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            {typeof window !== 'undefined' && (
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINY_MCE_API_KEY || ''}
                value={formData.description}
                onEditorChange={(content) => handleFieldChange('description', content)}
              />
            )}
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Type de service</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value: ServiceType) => handleFieldChange('serviceType', value)}
            >
              <SelectTrigger className={errors.serviceType ? 'border-red-500' : ''}>
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
            {errors.serviceType && (
              <p className="text-sm text-red-500">{errors.serviceType}</p>
            )}
          </div>

          {formData.serviceType === 'LIEU' && (
            <div className="space-y-2">
              <Label htmlFor="venueType">Type de lieu</Label>
              <Select
                value={formData.venueType || 'UNKNOWN'}
                onValueChange={(value: VenueType) => handleFieldChange('venueType', value)}
              >
                <SelectTrigger className={errors.venueType ? 'border-red-500' : ''}>
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
              {errors.venueType && (
                <p className="text-sm text-red-500">{errors.venueType}</p>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
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
              onChange={(e) => handleFieldChange('billingStreet', e.target.value)}
              className={errors.billingStreet ? 'border-red-500' : ''}
            />
            {errors.billingStreet && (
              <p className="text-sm text-red-500">{errors.billingStreet}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingCity">Ville</Label>
              <Input
                id="billingCity"
                value={formData.billingCity}
                onChange={(e) => handleFieldChange('billingCity', e.target.value)}
                className={errors.billingCity ? 'border-red-500' : ''}
              />
              {errors.billingCity && (
                <p className="text-sm text-red-500">{errors.billingCity}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingPostalCode">Code postal</Label>
              <Input
                id="billingPostalCode"
                value={formData.billingPostalCode}
                onChange={(e) => handleFieldChange('billingPostalCode', e.target.value)}
                className={errors.billingPostalCode ? 'border-red-500' : ''}
              />
              {errors.billingPostalCode && (
                <p className="text-sm text-red-500">{errors.billingPostalCode}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingCountry">Pays</Label>
            <Input
              id="billingCountry"
              value={formData.billingCountry}
              onChange={(e) => handleFieldChange('billingCountry', e.target.value)}
              className={errors.billingCountry ? 'border-red-500' : ''}
            />
            {errors.billingCountry && (
              <p className="text-sm text-red-500">{errors.billingCountry}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siret">Numéro SIRET</Label>
              <Input
                id="siret"
                value={formData.siret}
                onChange={(e) => handleFieldChange('siret', e.target.value)}
                className={errors.siret ? 'border-red-500' : ''}
              />
              {errors.siret && (
                <p className="text-sm text-red-500">{errors.siret}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">Numéro de TVA</Label>
              <Input
                id="vatNumber"
                value={formData.vatNumber}
                onChange={(e) => handleFieldChange('vatNumber', e.target.value)}
                className={errors.vatNumber ? 'border-red-500' : ''}
              />
              {errors.vatNumber && (
                <p className="text-sm text-red-500">{errors.vatNumber}</p>
              )}
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
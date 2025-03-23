'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from 'next-auth/react'

export default function PartnerStorefrontPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [storefrontData, setStorefrontData] = useState({
    name: '',
    description: '',
    logo: '',
    coverImage: '',
    isActive: true,
    // Informations de facturation
    billingAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: '',
      siret: '',
      vatNumber: '',
    },
    // Adresse du lieu (si applicable)
    venueAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: '',
      coordinates: {
        lat: '',
        lng: '',
      },
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Implémenter la logique de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: "Succès",
        description: "Votre vitrine a été mise à jour avec succès.",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de votre vitrine.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ma Vitrine</h2>
        <p className="text-muted-foreground">
          {`Personnalisez l'apparence de votre vitrine et gérez vos informations`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{`Informations de l'entreprise`}</CardTitle>
            <CardDescription>
              {`Les informations principales de votre entreprise`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{`Nom de l'entreprise`}</Label>
                <Input
                  id="name"
                  value={storefrontData.name}
                  onChange={(e) => setStorefrontData({ ...storefrontData, name: e.target.value })}
                  placeholder="Nom de votre entreprise"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{`Description`}</Label>
                <Textarea
                  id="description"
                  value={storefrontData.description}
                  onChange={(e) => setStorefrontData({ ...storefrontData, description: e.target.value })}
                  placeholder="Décrivez votre entreprise"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo">Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    // TODO: Implémenter la gestion du logo
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coverImage">Image de couverture</Label>
                <Input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    // TODO: Implémenter la gestion de l'image de couverture
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={storefrontData.isActive}
                  onCheckedChange={(checked) => setStorefrontData({ ...storefrontData, isActive: checked })}
                />
                <Label htmlFor="isActive">Vitrine active</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations de facturation</CardTitle>
            <CardDescription>
              Les informations de facturation de votre entreprise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="billingStreet">Adresse de facturation</Label>
                <Input
                  id="billingStreet"
                  value={storefrontData.billingAddress.street}
                  onChange={(e) => setStorefrontData({
                    ...storefrontData,
                    billingAddress: { ...storefrontData.billingAddress, street: e.target.value }
                  })}
                  placeholder="Rue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="billingCity">Ville</Label>
                  <Input
                    id="billingCity"
                    value={storefrontData.billingAddress.city}
                    onChange={(e) => setStorefrontData({
                      ...storefrontData,
                      billingAddress: { ...storefrontData.billingAddress, city: e.target.value }
                    })}
                    placeholder="Ville"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="billingPostalCode">Code postal</Label>
                  <Input
                    id="billingPostalCode"
                    value={storefrontData.billingAddress.postalCode}
                    onChange={(e) => setStorefrontData({
                      ...storefrontData,
                      billingAddress: { ...storefrontData.billingAddress, postalCode: e.target.value }
                    })}
                    placeholder="Code postal"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billingCountry">Pays</Label>
                <Input
                  id="billingCountry"
                  value={storefrontData.billingAddress.country}
                  onChange={(e) => setStorefrontData({
                    ...storefrontData,
                    billingAddress: { ...storefrontData.billingAddress, country: e.target.value }
                  })}
                  placeholder="Pays"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="siret">Numéro SIRET</Label>
                  <Input
                    id="siret"
                    value={storefrontData.billingAddress.siret}
                    onChange={(e) => setStorefrontData({
                      ...storefrontData,
                      billingAddress: { ...storefrontData.billingAddress, siret: e.target.value }
                    })}
                    placeholder="Numéro SIRET"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vatNumber">Numéro de TVA</Label>
                  <Input
                    id="vatNumber"
                    value={storefrontData.billingAddress.vatNumber}
                    onChange={(e) => setStorefrontData({
                      ...storefrontData,
                      billingAddress: { ...storefrontData.billingAddress, vatNumber: e.target.value }
                    })}
                    placeholder="Numéro de TVA"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {session?.user?.role === "PARTNER" && (
          <Card>
            <CardHeader>
              <CardTitle>Adresse du lieu</CardTitle>
              <CardDescription>
                {`L'adresse où se trouve votre établissement`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="venueStreet">Adresse du lieu</Label>
                  <Input
                    id="venueStreet"
                    value={storefrontData.venueAddress.street}
                    onChange={(e) => setStorefrontData({
                      ...storefrontData,
                      venueAddress: { ...storefrontData.venueAddress, street: e.target.value }
                    })}
                    placeholder="Rue"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="venueCity">Ville</Label>
                    <Input
                      id="venueCity"
                      value={storefrontData.venueAddress.city}
                      onChange={(e) => setStorefrontData({
                        ...storefrontData,
                        venueAddress: { ...storefrontData.venueAddress, city: e.target.value }
                      })}
                      placeholder="Ville"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="venuePostalCode">Code postal</Label>
                    <Input
                      id="venuePostalCode"
                      value={storefrontData.venueAddress.postalCode}
                      onChange={(e) => setStorefrontData({
                        ...storefrontData,
                        venueAddress: { ...storefrontData.venueAddress, postalCode: e.target.value }
                      })}
                      placeholder="Code postal"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="venueCountry">Pays</Label>
                  <Input
                    id="venueCountry"
                    value={storefrontData.venueAddress.country}
                    onChange={(e) => setStorefrontData({
                      ...storefrontData,
                      venueAddress: { ...storefrontData.venueAddress, country: e.target.value }
                    })}
                    placeholder="Pays"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="venueLat">Latitude</Label>
                    <Input
                      id="venueLat"
                      type="number"
                      step="any"
                      value={storefrontData.venueAddress.coordinates.lat}
                      onChange={(e) => setStorefrontData({
                        ...storefrontData,
                        venueAddress: {
                          ...storefrontData.venueAddress,
                          coordinates: { ...storefrontData.venueAddress.coordinates, lat: e.target.value }
                        }
                      })}
                      placeholder="Latitude"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="venueLng">Longitude</Label>
                    <Input
                      id="venueLng"
                      type="number"
                      step="any"
                      value={storefrontData.venueAddress.coordinates.lng}
                      onChange={(e) => setStorefrontData({
                        ...storefrontData,
                        venueAddress: {
                          ...storefrontData.venueAddress,
                          coordinates: { ...storefrontData.venueAddress.coordinates, lng: e.target.value }
                        }
                      })}
                      placeholder="Longitude"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  )
} 
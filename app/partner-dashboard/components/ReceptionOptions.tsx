'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface ReceptionSpace {
  id: string
  name: string
  description: string
  surface: number
  seatedCapacity: number
  standingCapacity: number
  hasDanceFloor: boolean
  hasPmrAccess: boolean
  hasPrivateOutdoor: boolean
}

interface ReceptionOptions {
  rentalDuration: string
  price: number
  accommodationType: string
  numberOfRooms: number
  numberOfBeds: number
  hasMandatoryCaterer: boolean
  providesCatering: boolean
  allowsOwnDrinks: boolean
  hasCorkageFee: boolean
  corkageFee: number
  hasTimeLimit: boolean
  timeLimit: string
  hasMandatoryPhotographer: boolean
  hasMusicExclusivity: boolean
  additionalServices: string
  includesCleaning: boolean
  allowsPets: boolean
  allowsMultipleEvents: boolean
  hasSecurityGuard: boolean
}

interface ReceptionOptionsProps {
  storefrontId: string
  initialData?: {
    spaces: ReceptionSpace[]
    options: ReceptionOptions
  }
}

export function ReceptionOptions({ storefrontId, initialData }: ReceptionOptionsProps) {
  console.log('[ReceptionOptions] Props reçues:', { storefrontId, initialData })

  const [spaces, setSpaces] = useState<ReceptionSpace[]>(initialData?.spaces || [])
  const [options, setOptions] = useState<ReceptionOptions>(initialData?.options || {
    rentalDuration: '',
    price: 0,
    accommodationType: '',
    numberOfRooms: 0,
    numberOfBeds: 0,
    hasMandatoryCaterer: false,
    providesCatering: false,
    allowsOwnDrinks: false,
    hasCorkageFee: false,
    corkageFee: 0,
    hasTimeLimit: false,
    timeLimit: '',
    hasMandatoryPhotographer: false,
    hasMusicExclusivity: false,
    additionalServices: '',
    includesCleaning: false,
    allowsPets: false,
    allowsMultipleEvents: false,
    hasSecurityGuard: false,
  })

  console.log('[ReceptionOptions] État initial:', { spaces, options })

  const handleSpaceChange = (index: number, field: keyof ReceptionSpace, value: any) => {
    const newSpaces = [...spaces]
    newSpaces[index] = { ...newSpaces[index], [field]: value }
    setSpaces(newSpaces)
  }

  const addSpace = () => {
    setSpaces([
      ...spaces,
      {
        id: Date.now().toString(),
        name: '',
        description: '',
        surface: 0,
        seatedCapacity: 0,
        standingCapacity: 0,
        hasDanceFloor: false,
        hasPmrAccess: false,
        hasPrivateOutdoor: false,
      },
    ])
  }

  const removeSpace = (index: number) => {
    setSpaces(spaces.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/partner-storefront/${storefrontId}/reception-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaces,
          options,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      toast.success('Options mises à jour avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour des options')
    }
  }

  return (
    <div className="space-y-6">
      {/* Espaces de réception */}
      <Card>
        <CardHeader>
          <CardTitle>Vos espaces de réception</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {spaces.map((space, index) => (
            <div key={space.id} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Espace {index + 1}</h3>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeSpace(index)}
                >
                  Supprimer
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Nom</Label>
                  <Input
                    id={`name-${index}`}
                    value={space.name}
                    onChange={(e) => handleSpaceChange(index, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`surface-${index}`}>Surface (m²)</Label>
                  <Input
                    id={`surface-${index}`}
                    type="number"
                    value={space.surface}
                    onChange={(e) => handleSpaceChange(index, 'surface', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Textarea
                  id={`description-${index}`}
                  value={space.description}
                  onChange={(e) => handleSpaceChange(index, 'description', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`seatedCapacity-${index}`}>Capacité assise</Label>
                  <Input
                    id={`seatedCapacity-${index}`}
                    type="number"
                    value={space.seatedCapacity}
                    onChange={(e) => handleSpaceChange(index, 'seatedCapacity', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`standingCapacity-${index}`}>Capacité debout</Label>
                  <Input
                    id={`standingCapacity-${index}`}
                    type="number"
                    value={space.standingCapacity}
                    onChange={(e) => handleSpaceChange(index, 'standingCapacity', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`danceFloor-${index}`}
                    checked={space.hasDanceFloor}
                    onCheckedChange={(checked) => handleSpaceChange(index, 'hasDanceFloor', checked)}
                  />
                  <Label htmlFor={`danceFloor-${index}`}>Piste de danse</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`pmrAccess-${index}`}
                    checked={space.hasPmrAccess}
                    onCheckedChange={(checked) => handleSpaceChange(index, 'hasPmrAccess', checked)}
                  />
                  <Label htmlFor={`pmrAccess-${index}`}>Accès PMR</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`privateOutdoor-${index}`}
                    checked={space.hasPrivateOutdoor}
                    onCheckedChange={(checked) => handleSpaceChange(index, 'hasPrivateOutdoor', checked)}
                  />
                  <Label htmlFor={`privateOutdoor-${index}`}>Extérieur privatif</Label>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" onClick={addSpace}>
            Ajouter un espace
          </Button>
        </CardContent>
      </Card>

      {/* Durée de location et tarif */}
      <Card>
        <CardHeader>
          <CardTitle>Durée de location et tarif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rentalDuration">Durée de location</Label>
              <Input
                id="rentalDuration"
                value={options.rentalDuration}
                onChange={(e) => setOptions({ ...options, rentalDuration: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Tarif</Label>
              <Input
                id="price"
                type="number"
                value={options.price}
                onChange={(e) => setOptions({ ...options, price: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hébergement */}
      <Card>
        <CardHeader>
          <CardTitle>Hébergement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accommodationType">Type d&apos;hébergement</Label>
              <Input
                id="accommodationType"
                value={options.accommodationType}
                onChange={(e) => setOptions({ ...options, accommodationType: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfRooms">Nombre de chambres</Label>
              <Input
                id="numberOfRooms"
                type="number"
                value={options.numberOfRooms}
                onChange={(e) => setOptions({ ...options, numberOfRooms: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="numberOfBeds">Nombre de lits</Label>
            <Input
              id="numberOfBeds"
              type="number"
              value={options.numberOfBeds}
              onChange={(e) => setOptions({ ...options, numberOfBeds: parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Restauration */}
      <Card>
        <CardHeader>
          <CardTitle>Restauration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hasMandatoryCaterer">Traiteur obligatoire</Label>
              <RadioGroup
                value={options.hasMandatoryCaterer ? 'yes' : 'no'}
                onValueChange={(value) => setOptions({ ...options, hasMandatoryCaterer: value === 'yes' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="mandatoryCaterer-yes" />
                  <Label htmlFor="mandatoryCaterer-yes">Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="mandatoryCaterer-no" />
                  <Label htmlFor="mandatoryCaterer-no">Non</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="providesCatering"
                checked={options.providesCatering}
                onCheckedChange={(checked) => setOptions({ ...options, providesCatering: checked })}
              />
              <Label htmlFor="providesCatering">Traiteur sur place</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="allowsOwnDrinks"
                checked={options.allowsOwnDrinks}
                onCheckedChange={(checked) => setOptions({ ...options, allowsOwnDrinks: checked })}
              />
              <Label htmlFor="allowsOwnDrinks">Boissons personnelles autorisées</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="hasCorkageFee"
                checked={options.hasCorkageFee}
                onCheckedChange={(checked) => setOptions({ ...options, hasCorkageFee: checked })}
              />
              <Label htmlFor="hasCorkageFee">Droit de bouchon</Label>
            </div>
          </div>
          {options.hasCorkageFee && (
            <div className="space-y-2">
              <Label htmlFor="corkageFee">Montant du droit de bouchon</Label>
              <Input
                id="corkageFee"
                type="number"
                value={options.corkageFee}
                onChange={(e) => setOptions({ ...options, corkageFee: parseFloat(e.target.value) })}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasTimeLimit"
                checked={options.hasTimeLimit}
                onCheckedChange={(checked) => setOptions({ ...options, hasTimeLimit: checked })}
              />
              <Label htmlFor="hasTimeLimit">Limite horaire</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="hasMandatoryPhotographer"
                checked={options.hasMandatoryPhotographer}
                onCheckedChange={(checked) => setOptions({ ...options, hasMandatoryPhotographer: checked })}
              />
              <Label htmlFor="hasMandatoryPhotographer">Photographe obligatoire</Label>
            </div>
          </div>
          {options.hasTimeLimit && (
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Limite horaire</Label>
              <Input
                id="timeLimit"
                value={options.timeLimit}
                onChange={(e) => setOptions({ ...options, timeLimit: e.target.value })}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasMusicExclusivity"
                checked={options.hasMusicExclusivity}
                onCheckedChange={(checked) => setOptions({ ...options, hasMusicExclusivity: checked })}
              />
              <Label htmlFor="hasMusicExclusivity">Exclusivité musicale</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="includesCleaning"
                checked={options.includesCleaning}
                onCheckedChange={(checked) => setOptions({ ...options, includesCleaning: checked })}
              />
              <Label htmlFor="includesCleaning">Nettoyage inclus</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="allowsPets"
                checked={options.allowsPets}
                onCheckedChange={(checked) => setOptions({ ...options, allowsPets: checked })}
              />
              <Label htmlFor="allowsPets">Animaux acceptés</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="allowsMultipleEvents"
                checked={options.allowsMultipleEvents}
                onCheckedChange={(checked) => setOptions({ ...options, allowsMultipleEvents: checked })}
              />
              <Label htmlFor="allowsMultipleEvents">Événements multiples</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="hasSecurityGuard"
              checked={options.hasSecurityGuard}
              onCheckedChange={(checked) => setOptions({ ...options, hasSecurityGuard: checked })}
            />
            <Label htmlFor="hasSecurityGuard">Agent de sécurité</Label>
          </div>
        </CardContent>
      </Card>

      {/* Services additionnels */}
      <Card>
        <CardHeader>
          <CardTitle>Services supplémentaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additionalServices">Quels autres types de services proposez-vous ?</Label>
            <Textarea
              id="additionalServices"
              value={options.additionalServices}
              onChange={(e) => setOptions({ ...options, additionalServices: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
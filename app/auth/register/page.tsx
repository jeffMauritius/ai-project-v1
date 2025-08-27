'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState, useEffect } from 'react'
import { 
  registerCoupleSchema, 
  registerPartnerSchema, 
  type RegisterCoupleFormData, 
  type RegisterPartnerFormData 
} from '@/lib/validation-schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const partnerTypes = [
  { id: 'venue', name: 'Lieu de réception' },
  { id: 'catering', name: 'Traiteur' },
  { id: 'photographer', name: 'Photographe' },
  { id: 'florist', name: 'Fleuriste' },
  { id: 'dj', name: 'DJ / Musicien' },
  { id: 'decorator', name: 'Décorateur' },
  { id: 'cake', name: 'Wedding Cake' },
  { id: 'dress', name: 'Robe de mariée' },
  { id: 'suit', name: 'Costume' },
  { id: 'beauty', name: 'Coiffure / Maquillage' },
  { id: 'car', name: 'Location de voiture' },
  { id: 'planner', name: 'Wedding Planner' },
]

export default function Register() {
  const [accountType, setAccountType] = useState<'couple' | 'partner'>('couple')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const router = useRouter()
  
  // Form pour couple
  const coupleForm = useForm<RegisterCoupleFormData>({
    resolver: zodResolver(registerCoupleSchema),
    mode: 'onChange',
  })

  // Form pour partenaire
  const partnerForm = useForm<RegisterPartnerFormData>({
    resolver: zodResolver(registerPartnerSchema),
    mode: 'onChange',
  })

  // Utiliser le bon formulaire selon le type de compte
  const form = accountType === 'couple' ? coupleForm : partnerForm
  const errors = form.formState.errors
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Réinitialiser les formulaires quand on change de type de compte
  useEffect(() => {
    form.reset()
    setError(null)
  }, [accountType, form])

  if (!mounted) {
    return null
  }

  async function onSubmit(data: RegisterCoupleFormData | RegisterPartnerFormData) {
    setIsLoading(true)
    setError(null)

    try {
      const requestBody: any = {
        email: data.email,
        password: data.password,
        name: data.name,
        role: accountType === 'partner' ? 'PARTNER' : 'USER'
      }

      // Ajouter les données spécifiques aux partenaires
      if (accountType === 'partner') {
        const partnerData = data as RegisterPartnerFormData
        requestBody.partnerType = partnerData.partnerType
        requestBody.siret = partnerData.siret
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Une erreur est survenue')
      }

      router.push('/auth/login')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Créer un compte
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ou{' '}
            <Link href="/auth/login" className="font-medium text-pink-600 hover:text-pink-500">
              connectez-vous à votre compte
            </Link>
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <button
            type="button"
            onClick={() => setAccountType('couple')}
            className={`flex-1 py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
              accountType === 'couple'
                ? 'bg-pink-600 text-white hover:bg-pink-500 border-transparent'
                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-center">
              <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
              Futur marié
            </div>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('partner')}
            className={`flex-1 py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
              accountType === 'partner'
                ? 'bg-pink-600 text-white hover:bg-pink-500 border-transparent'
                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-center">
              <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
              Prestataire
            </div>
          </button>
        </div>

        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div>
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
              Nom complet
            </Label>
            <Input
              id="name"
              type="text"
              className={`mt-1 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="John Doe"
              {...(accountType === 'couple' ? coupleForm.register('name') : partnerForm.register('name'))}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Adresse email
            </Label>
            <Input
              id="email"
              type="text"
              autoComplete="email"
              className={`mt-1 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="vous@exemple.fr"
              {...(accountType === 'couple' ? coupleForm.register('email') : partnerForm.register('email'))}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {accountType === 'partner' && (
            <>
              <div>
                <Label htmlFor="partner-type" className="text-gray-700 dark:text-gray-300">
                  Type de prestation
                </Label>
                <Select 
                  onValueChange={(value) => partnerForm.setValue('partnerType', value)}
                  value={partnerForm.watch('partnerType')}
                >
                  <SelectTrigger className={`mt-1 ${errors.partnerType ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}>
                    <SelectValue placeholder="Sélectionnez votre activité" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.partnerType && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.partnerType.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="siret" className="text-gray-700 dark:text-gray-300">
                  Numéro SIRET
                </Label>
                <Input
                  id="siret"
                  type="text"
                  className={`mt-1 ${errors.siret ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="12345678901234"
                  {...partnerForm.register('siret')}
                />
                <p className="mt-1 text-xs text-gray-500">Format : 14 chiffres sans espaces</p>
                {errors.siret && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.siret.message}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className={`mt-1 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="••••••••"
              {...(accountType === 'couple' ? coupleForm.register('password') : partnerForm.register('password'))}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password-confirmation" className="text-gray-700 dark:text-gray-300">
              Confirmer le mot de passe
            </Label>
            <Input
              id="password-confirmation"
              type="password"
              autoComplete="new-password"
              className={`mt-1 ${errors.passwordConfirmation ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="••••••••"
              {...(accountType === 'couple' ? coupleForm.register('passwordConfirmation') : partnerForm.register('passwordConfirmation'))}
            />
            {errors.passwordConfirmation && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.passwordConfirmation.message}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <Checkbox
              id="terms"
              checked={accountType === 'couple' ? coupleForm.watch('terms') : partnerForm.watch('terms')}
              onCheckedChange={(checked) => {
                if (accountType === 'couple') {
                  coupleForm.setValue('terms', checked as boolean)
                } else {
                  partnerForm.setValue('terms', checked as boolean)
                }
              }}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              J&apos;accepte les{' '}
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="font-medium text-pink-600 hover:text-pink-500"
              >
                conditions d&apos;utilisation
              </button>
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.terms.message}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              {isLoading ? 'Création...' : 'Créer mon compte'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal des conditions d'utilisation */}
      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conditions d'utilisation</DialogTitle>
            <DialogDescription>
              Veuillez lire attentivement les conditions d'utilisation avant de créer votre compte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3>1. Acceptation des conditions</h3>
              <p>
                En créant un compte sur MonMariage.ai, vous acceptez d'être lié par ces conditions d'utilisation. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
              </p>

              <h3>2. Description du service</h3>
              <p>
                MonMariage.ai est une plateforme qui met en relation les futurs mariés avec des prestataires 
                de services de mariage. Nous facilitons la recherche, la comparaison et la réservation de 
                services pour votre mariage.
              </p>

              <h3>3. Compte utilisateur</h3>
              <p>
                Vous êtes responsable de maintenir la confidentialité de vos informations de connexion 
                et de toutes les activités qui se produisent sous votre compte. Vous devez nous notifier 
                immédiatement toute utilisation non autorisée de votre compte.
              </p>

              <h3>4. Utilisation acceptable</h3>
              <p>
                Vous vous engagez à utiliser notre service uniquement à des fins légales et conformes 
                à ces conditions. Vous ne devez pas utiliser notre service pour :
              </p>
              <ul>
                <li>Violer toute loi applicable</li>
                <li>Harceler, abuser ou nuire à d'autres utilisateurs</li>
                <li>Transmettre du contenu offensant ou inapproprié</li>
                <li>Tenter d'accéder non autorisé à nos systèmes</li>
              </ul>

              <h3>5. Protection des données</h3>
              <p>
                Nous nous engageons à protéger vos données personnelles conformément à notre politique 
                de confidentialité. Vos informations ne seront utilisées que dans le cadre de la 
                fourniture de nos services.
              </p>

              <h3>6. Limitation de responsabilité</h3>
              <p>
                MonMariage.ai agit comme intermédiaire entre les utilisateurs et les prestataires. 
                Nous ne sommes pas responsables de la qualité des services fournis par les prestataires 
                ou des accords conclus entre utilisateurs et prestataires.
              </p>

              <h3>7. Modifications</h3>
              <p>
                Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications 
                entrent en vigueur dès leur publication sur notre site.
              </p>

              <h3>8. Contact</h3>
              <p>
                Pour toute question concernant ces conditions d'utilisation, veuillez nous contacter 
                à l'adresse suivante : contact@monmariage.ai
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsTermsModalOpen(false)}
              className="w-full sm:w-auto"
            >
              J'ai compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BuildingStorefrontIcon, HeartIcon } from '@heroicons/react/24/outline'
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
import { Heart, Sparkles, User, Mail, Lock, Building, AlertCircle, CheckCircle } from 'lucide-react'

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
    <div className="min-h-screen">
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md">
          {/* Header with logo and welcome message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Rejoignez monmariage.ai
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Créez votre compte pour commencer à planifier votre mariage
            </p>
          </div>

          {/* Registration form card */}
          <div className="rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-pink-500 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Créer un compte
              </h2>
            </div>

            {/* Account type selection */}
            <div className="flex justify-center space-x-2 mb-8">
              <button
                type="button"
                onClick={() => setAccountType('couple')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  accountType === 'couple'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-center">
                  <HeartIcon className="h-5 w-5 mr-2" />
                  Futur marié
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('partner')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  accountType === 'partner'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Building className="h-5 w-5 mr-2" />
                  Prestataire
                </div>
              </button>
            </div>

            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              {error && (
                <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
              
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom complet
                </Label>
                <div className="mt-2 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    className={`pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}
                    placeholder="John Doe"
                    {...(accountType === 'couple' ? coupleForm.register('name') : partnerForm.register('name'))}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adresse email
                </Label>
                <div className="mt-2 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="text"
                    autoComplete="email"
                    className={`pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}
                    placeholder="vous@exemple.fr"
                    {...(accountType === 'couple' ? coupleForm.register('email') : partnerForm.register('email'))}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {accountType === 'partner' && (
                <>
                  <div>
                    <Label htmlFor="partner-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type de prestation
                    </Label>
                    <div className="mt-2 relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                      <Select 
                        onValueChange={(value) => partnerForm.setValue('partnerType', value)}
                        value={partnerForm.watch('partnerType')}
                      >
                        <SelectTrigger className={`pl-10 rounded-lg border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm ${errors.partnerType ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}>
                          <SelectValue placeholder="Sélectionnez votre activité" />
                        </SelectTrigger>
                        <SelectContent>
                          {partnerTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.partnerType && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.partnerType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="siret" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Numéro SIRET
                    </Label>
                    <div className="mt-2 relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="siret"
                        type="text"
                        className={`pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm ${errors.siret ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}
                        placeholder="12345678901234"
                        {...partnerForm.register('siret')}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Format : 14 chiffres sans espaces</p>
                    {errors.siret && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.siret.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe
                </Label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className={`pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}
                    placeholder="••••••••"
                    {...(accountType === 'couple' ? coupleForm.register('password') : partnerForm.register('password'))}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password-confirmation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirmer le mot de passe
                </Label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password-confirmation"
                    type="password"
                    autoComplete="new-password"
                    className={`pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm ${errors.passwordConfirmation ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}
                    placeholder="••••••••"
                    {...(accountType === 'couple' ? coupleForm.register('passwordConfirmation') : partnerForm.register('passwordConfirmation'))}
                  />
                </div>
                {errors.passwordConfirmation && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.passwordConfirmation.message}
                  </p>
                )}
              </div>

              <div className="flex items-start">
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
                  className="border-pink-300 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 mt-1"
                />
                <label htmlFor="terms" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                  J&apos;accepte les{' '}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="font-medium text-pink-600 hover:text-pink-500 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"
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
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Création...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Créer mon compte
                    </div>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-medium">
                    Ou
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Déjà un compte ?{' '}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-pink-600 hover:text-pink-500 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              En créant un compte, vous acceptez nos{' '}
              <Link href="/legal/terms" className="text-pink-600 hover:text-pink-500 dark:text-pink-400">
                conditions d&apos;utilisation
              </Link>{' '}
              et notre{' '}
              <Link href="/legal/privacy" className="text-pink-600 hover:text-pink-500 dark:text-pink-400">
                politique de confidentialité
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Modal des conditions d'utilisation */}
      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conditions d&apos;utilisation</DialogTitle>
            <DialogDescription>
              Veuillez lire attentivement les conditions d&apos;utilisation avant de créer votre compte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3>1. Acceptation des conditions</h3>
              <p>
                En créant un compte sur MonMariage.ai, vous acceptez d&apos;être lié par ces conditions d&apos;utilisation. 
                Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser notre service.
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
                <li>Harceler, abuser ou nuire à d&apos;autres utilisateurs</li>
                <li>Transmettre du contenu offensant ou inapproprié</li>
                <li>Tenter d&apos;accéder non autorisé à nos systèmes</li>
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
                Pour toute question concernant ces conditions d&apos;utilisation, veuillez nous contacter 
                à l&apos;adresse suivante : contact@monmariage.ai
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsTermsModalOpen(false)}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              J&apos;ai compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
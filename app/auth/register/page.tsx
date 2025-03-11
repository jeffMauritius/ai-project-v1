'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EnvelopeIcon, LockClosedIcon, UserIcon, BuildingStorefrontIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from 'react'

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
  const router = useRouter()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role: accountType === 'partner' ? 'PARTNER' : 'USER'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
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
              <UserIcon className="h-5 w-5 mr-2" />
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

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
              Nom complet
            </Label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="name"
                name="name"
                type="text"
                required
                className="pl-10"
                placeholder="John Doe"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Adresse email
            </Label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="pl-10"
                placeholder="vous@exemple.fr"
              />
            </div>
          </div>

          {accountType === 'partner' && (
            <>
              <div>
                <Label htmlFor="partner-type" className="text-gray-700 dark:text-gray-300">
                  Type de prestation
                </Label>
                <Select name="partner-type" required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionnez votre activité" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="siret" className="text-gray-700 dark:text-gray-300">
                  Numéro SIRET
                </Label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdentificationIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <Input
                    id="siret"
                    name="siret"
                    type="text"
                    required
                    pattern="[0-9]{14}"
                    className="pl-10"
                    placeholder="12345678901234"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Format : 14 chiffres sans espaces</p>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
              Mot de passe
            </Label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password-confirmation" className="text-gray-700 dark:text-gray-300">
              Confirmer le mot de passe
            </Label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="password-confirmation"
                name="password-confirmation"
                type="password"
                autoComplete="new-password"
                required
                className="pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center">
            <Checkbox
              id="terms"
              name="terms"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              J&apos;accepte les{' '}
              <Link href="/legal/terms" className="font-medium text-pink-600 hover:text-pink-500">
                conditions d&apos;utilisation
              </Link>
            </label>
          </div>

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
    </div>
  )
}
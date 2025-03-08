'use client'

import Link from 'next/link'
import { EnvelopeIcon, LockClosedIcon, UserIcon, BuildingStorefrontIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

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

        <form className="space-y-6" action="#" method="POST">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Adresse email
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="vous@exemple.fr"
              />
            </div>
          </div>

          {accountType === 'partner' && (
            <>
              <div>
                <label htmlFor="partner-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type de prestation
                </label>
                <select
                  id="partner-type"
                  name="partner-type"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>Sélectionnez votre activité</option>
                  {partnerTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="siret" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Numéro SIRET
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdentificationIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="siret"
                    name="siret"
                    type="text"
                    required
                    pattern="[0-9]{14}"
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="12345678901234"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Format : 14 chiffres sans espaces</p>
              </div>
            </>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mot de passe
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password-confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirmer le mot de passe
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password-confirmation"
                name="password-confirmation"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
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
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Créer mon compte
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Switch } from '@headlessui/react'
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: {
      newMessage: true,
      newReview: true,
      newBooking: true
    },
    sms: {
      newMessage: false,
      newReview: false,
      newBooking: true
    },
    push: {
      newMessage: true,
      newReview: false,
      newBooking: true
    }
  })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Paramètres</h1>
      
      {/* Informations du compte */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Informations du compte
        </h2>
        <form className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prénom
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                defaultValue="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                defaultValue="Dupont"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                defaultValue="jean.dupont@example.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Téléphone
              </label>
              <input
                type="tel"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                defaultValue="+33 6 12 34 56 78"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Notifications
        </h2>
        <div className="space-y-6">
          {/* Email */}
          <div>
            <div className="flex items-center mb-4">
              <EnvelopeIcon className="h-6 w-6 text-gray-400 mr-2" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                Notifications par email
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Nouveaux messages
                </label>
                <Switch
                  checked={notifications.email.newMessage}
                  onChange={(checked) => setNotifications({
                    ...notifications,
                    email: { ...notifications .email, newMessage: checked }
                  })}
                  className={`${
                    notifications.email.newMessage ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      notifications.email.newMessage ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Nouveaux avis
                </label>
                <Switch
                  checked={notifications.email.newReview}
                  onChange={(checked) => setNotifications({
                    ...notifications,
                    email: { ...notifications.email, newReview: checked }
                  })}
                  className={`${
                    notifications.email.newReview ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      notifications.email.newReview ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Nouvelles réservations
                </label>
                <Switch
                  checked={notifications.email.newBooking}
                  onChange={(checked) => setNotifications({
                    ...notifications,
                    email: { ...notifications.email, newBooking: checked }
                  })}
                  className={`${
                    notifications.email.newBooking ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      notifications.email.newBooking ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </div>
          </div>

          {/* SMS */}
          <div>
            <div className="flex items-center mb-4">
              <DevicePhoneMobileIcon className="h-6 w-6 text-gray-400 mr-2" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                Notifications par SMS
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Nouveaux messages
                </label>
                <Switch
                  checked={notifications.sms.newMessage}
                  onChange={(checked) => setNotifications({
                    ...notifications,
                    sms: { ...notifications.sms, newMessage: checked }
                  })}
                  className={`${
                    notifications.sms.newMessage ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      notifications.sms.newMessage ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Nouveaux avis
                </label>
                <Switch
                  checked={notifications.sms.newReview}
                  onChange={(checked) => setNotifications({
                    ...notifications,
                    sms: { ...notifications.sms, newReview: checked }
                  })}
                  className={`${
                    notifications.sms.newReview ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      notifications.sms.newReview ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Nouvelles réservations
                </label>
                <Switch
                  checked={notifications.sms.newBooking}
                  onChange={(checked) => setNotifications({
                    ...notifications,
                    sms: { ...notifications.sms, newBooking: checked }
                  })}
                  className={`${
                    notifications.sms.newBooking ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      notifications.sms.newBooking ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </div>
          </div>

          {/* Push */}
          <div>
            <div className="flex items-center mb-4">
              <BellIcon className="h-6 w-6 text-gray-400 mr-2" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                Notifications push
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Nouveaux messages
                </label>
                <Switch
                  checked={notifications.push.newMessage}
                  onChange={(checked) => setNotifications({
                    ...notifications,
                    push: { ...notifications.push, newMessage: checked }
                  })}
                  className={`${
                    notifications.push.newMessage ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      notifications.push.newMessage ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Nouveaux avis
                </label>
                <Switch
                  checked={notifications.push.newReview}
                  onChange={(checked) => setNotifications({
                    ...notifications,
                    push: { ...notifications.push, newReview: checked }
                  })}
                  className={`${
                    notifications.push.newReview ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      notifications.push.newReview ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Nouvelles réservations
                </label>
                <Switch
                  checked={notifications.push.newBooking}
                  onChange={(checked) => setNotifications({
                    ...notifications,
                    push: { ...notifications.push, newBooking: checked }
                  })}
                  className={`${
                    notifications.push.newBooking ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      notifications.push.newBooking ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sécurité */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Sécurité
        </h2>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mot de passe actuel
            </label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
            >
              Mettre à jour le mot de passe
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { PlusIcon, TrashIcon, BanknotesIcon } from '@heroicons/react/24/outline'

type Provider = {
  id: number
  name: string
  type: string
  date: string
  status: 'confirmed' | 'pending' | 'cancelled'
  price: number
  deposit: number
  notes: string
}

const providerTypes = [
  { id: 'venue', name: 'Lieu' },
  { id: 'catering', name: 'Traiteur' },
  { id: 'photo', name: 'Photographe' },
  { id: 'music', name: 'Musique' },
  { id: 'flowers', name: 'Fleuriste' },
  { id: 'decoration', name: 'Décoration' }
]

export default function Planning() {
  const [providers, setProviders] = useState<Provider[]>([
    {
      id: 1,
      name: 'Château de Vaux-le-Vicomte',
      type: 'venue',
      date: '2024-06-15',
      status: 'confirmed',
      price: 15000,
      deposit: 5000,
      notes: 'Acompte versé, visite prévue le 15/02'
    },
    {
      id: 2,
      name: 'Traiteur Royal',
      type: 'catering',
      date: '2024-06-15',
      status: 'pending',
      price: 12000,
      deposit: 0,
      notes: 'Devis en attente'
    }
  ])

  const [isAddingProvider, setIsAddingProvider] = useState(false)
  const [newProvider, setNewProvider] = useState<Omit<Provider, 'id'>>({
    name: '',
    type: 'venue',
    date: '',
    status: 'pending',
    price: 0,
    deposit: 0,
    notes: ''
  })

  const totalBudget = providers.reduce((sum, provider) => sum + provider.price, 0)
  const totalPaid = providers.reduce((sum, provider) => sum + provider.deposit, 0)
  const remaining = totalBudget - totalPaid

  const handleAddProvider = () => {
    const providerToAdd = {
      id: Math.max(0, ...providers.map(p => p.id)) + 1,
      ...newProvider
    }
    setProviders([...providers, providerToAdd])
    setNewProvider({
      name: '',
      type: 'venue',
      date: '',
      status: 'pending',
      price: 0,
      deposit: 0,
      notes: ''
    })
    setIsAddingProvider(false)
  }

  const handleDeleteProvider = (id: number) => {
    setProviders(providers.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organisation du mariage</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez vos prestataires et votre budget
          </p>
        </div>
        <button
          onClick={() => setIsAddingProvider(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un prestataire
        </button>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget total</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalBudget.toLocaleString()}€</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Déjà payé</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalPaid.toLocaleString()}€</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-pink-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reste à payer</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{remaining.toLocaleString()}€</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Timeline des prestataires</h2>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {providers.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((provider, providerIdx) => (
              <li key={provider.id}>
                <div className="relative pb-8">
                  {providerIdx !== providers.length - 1 ? (
                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-900 ${
                        provider.status === 'confirmed'
                          ? 'bg-green-500'
                          : provider.status === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}>
                        <span className="text-white text-sm">{providerTypes.find(t => t.id === provider.type)?.name[0]}</span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {provider.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {providerTypes.find(t => t.id === provider.type)?.name}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Date : {new Date(provider.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Prix : {provider.price.toLocaleString()}€ (Acompte : {provider.deposit.toLocaleString()}€)
                        </p>
                        {provider.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            {provider.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal d'ajout */}
      {isAddingProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Ajouter un prestataire
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleAddProvider()
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom du prestataire
                  </label>
                  <input
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    value={newProvider.type}
                    onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    {providerTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newProvider.date}
                    onChange={(e) => setNewProvider({ ...newProvider, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statut
                  </label>
                  <select
                    value={newProvider.status}
                    onChange={(e) => setNewProvider({ ...newProvider, status: e.target.value as Provider['status'] })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prix total (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProvider.price}
                    onChange={(e) => setNewProvider({ ...newProvider, price: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Acompte versé (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={newProvider.price}
                    value={newProvider.deposit}
                    onChange={(e) => setNewProvider({ ...newProvider, deposit: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <textarea
                    value={newProvider.notes}
                    onChange={(e) => setNewProvider({ ...newProvider, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingProvider(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
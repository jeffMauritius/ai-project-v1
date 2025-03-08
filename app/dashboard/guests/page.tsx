'use client'

import { useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline'

type GuestGroup = {
  id: number
  name: string
  type: string
  count: number
  confirmed: boolean
  notes: string
}

type Guest = {
  id: number
  firstName: string
  lastName: string
  email: string
  status: 'pending' | 'confirmed' | 'declined'
  groupId: number
}

const guestTypes = [
  { id: 'family', name: 'Famille' },
  { id: 'friends', name: 'Amis' },
  { id: 'colleagues', name: 'Collègues' },
  { id: 'other', name: 'Autres' }
]

export default function Guests() {
  const [guests, setGuests] = useState<GuestGroup[]>([
    { id: 1, name: 'Famille de la mariée', type: 'family', count: 12, confirmed: true, notes: 'Inclut les grands-parents et cousins' },
    { id: 2, name: 'Amis d\'enfance', type: 'friends', count: 8, confirmed: false, notes: 'Groupe de l\'école' },
    { id: 3, name: 'Équipe marketing', type: 'colleagues', count: 6, confirmed: true, notes: 'Équipe actuelle' }
  ])

  const [individualGuests, setIndividualGuests] = useState<Guest[]>([
    {
      id: 1,
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@email.com',
      status: 'confirmed',
      groupId: 1
    },
    {
      id: 2,
      firstName: 'Pierre',
      lastName: 'Dubois',
      email: 'pierre.dubois@email.com',
      status: 'pending',
      groupId: 2
    },
    {
      id: 3,
      firstName: 'Sophie',
      lastName: 'Leroy',
      email: 'sophie.leroy@email.com',
      status: 'declined',
      groupId: 3
    }
  ])

  const [isAddingGuest, setIsAddingGuest] = useState(false)
  const [editingGuest, setEditingGuest] = useState<GuestGroup | null>(null)
  const [isAddingIndividualGuest, setIsAddingIndividualGuest] = useState(false)
  const [editingIndividualGuest, setEditingIndividualGuest] = useState<Guest | null>(null)
  const [newGuest, setNewGuest] = useState<Omit<GuestGroup, 'id'>>({
    name: '',
    type: 'family',
    count: 1,
    confirmed: false,
    notes: ''
  })

  const handleAddGuest = () => {
    const guestToAdd = {
      id: Math.max(0, ...guests.map(g => g.id)) + 1,
      ...newGuest
    }
    setGuests([...guests, guestToAdd])
    setNewGuest({
      name: '',
      type: 'family',
      count: 1,
      confirmed: false,
      notes: ''
    })
    setIsAddingGuest(false)
  }

  const handleUpdateGuest = () => {
    if (!editingGuest) return
    setGuests(guests.map(g => g.id === editingGuest.id ? editingGuest : g))
    setEditingGuest(null)
  }

  const handleDeleteGuest = (id: number) => {
    setGuests(guests.filter(g => g.id !== id))
  }

  const totalGuests = guests.reduce((sum, guest) => sum + guest.count, 0)
  const confirmedGuests = guests.reduce((sum, guest) => guest.confirmed ? sum + guest.count : sum, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invités</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {confirmedGuests} confirmés sur {totalGuests} invités au total
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAddingGuest(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter un groupe
          </button>
          <button
            onClick={() => setIsAddingIndividualGuest(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Ajouter un invité
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {guestTypes.map(type => {
          const typeGuests = guests.filter(g => g.type === type.id)
          const typeCount = typeGuests.reduce((sum, g) => sum + g.count, 0)
          const typeConfirmed = typeGuests.reduce((sum, g) => g.confirmed ? sum + g.count : sum, 0)
          
          return (
            <div key={type.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{type.name}</h3>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {typeConfirmed}/{typeCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">invités confirmés</p>
            </div>
          )
        })}
      </div>

      {/* Liste des groupes */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Groupe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {guest.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {guestTypes.find(t => t.id === guest.type)?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {guest.count} personnes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    guest.confirmed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {guest.confirmed ? 'Confirmé' : 'En attente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {guest.notes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingGuest(guest)}
                    className="text-pink-600 hover:text-pink-900 dark:hover:text-pink-400 mr-3"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGuest(guest.id)}
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout/modification */}
      {(isAddingGuest || editingGuest) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isAddingGuest ? 'Ajouter un groupe' : 'Modifier le groupe'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              isAddingGuest ? handleAddGuest() : handleUpdateGuest()
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    value={isAddingGuest ? newGuest.name : editingGuest?.name}
                    onChange={(e) => isAddingGuest
                      ? setNewGuest({ ...newGuest, name: e.target.value })
                      : setEditingGuest(prev => prev ? { ...prev, name: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    value={isAddingGuest ? newGuest.type : editingGuest?.type}
                    onChange={(e) => isAddingGuest
                      ? setNewGuest({ ...newGuest, type: e.target.value })
                      : setEditingGuest(prev => prev ? { ...prev, type: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    {guestTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre de personnes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={isAddingGuest ? newGuest.count : editingGuest?.count}
                    onChange={(e) => isAddingGuest
                      ? setNewGuest({ ...newGuest, count: parseInt(e.target.value) })
                      : setEditingGuest(prev => prev ? { ...prev, count: parseInt(e.target.value) } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <textarea
                    value={isAddingGuest ? newGuest.notes : editingGuest?.notes}
                    onChange={(e) => isAddingGuest
                      ? setNewGuest({ ...newGuest, notes: e.target.value })
                      : setEditingGuest(prev => prev ? { ...prev, notes: e.target.value } : null)
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAddingGuest ? newGuest.confirmed : editingGuest?.confirmed}
                    onChange={(e) => isAddingGuest
                      ? setNewGuest({ ...newGuest, confirmed: e.target.checked })
                      : setEditingGuest(prev => prev ? { ...prev, confirmed: e.target.checked } : null)
                    }
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Présence confirmée
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGuest(false)
                    setEditingGuest(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
                >
                  {isAddingGuest ? 'Ajouter' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des invités individuels */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Liste des invités</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Groupe
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {individualGuests.map((guest) => (
              <tr key={guest.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {guest.firstName} {guest.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {guest.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {guests.find(g => g.id === guest.groupId)?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    guest.status === 'confirmed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : guest.status === 'declined'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {guest.status === 'confirmed' ? 'Confirmé' : guest.status === 'declined' ? 'Refusé' : 'En attente'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingIndividualGuest(guest)}
                    className="text-pink-600 hover:text-pink-900 dark:hover:text-pink-400 mr-3"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {/* Handle delete */}}
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout/modification d'invité individuel */}
      {(isAddingIndividualGuest || editingIndividualGuest) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isAddingIndividualGuest ? 'Ajouter un invité' : 'Modifier l\'invité'}
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prénom
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Groupe
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  required
                >
                  <option value="">Sélectionner un groupe</option>
                  {guests.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Statut
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  required
                >
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="declined">Refusé</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingIndividualGuest(false)
                    setEditingIndividualGuest(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
                >
                  {isAddingIndividualGuest ? 'Ajouter' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PlusIcon, TrashIcon, GiftIcon, BanknotesIcon, PencilIcon, UsersIcon } from '@heroicons/react/24/outline'

type RegistryItem = {
  id: number
  name: string
  type: 'gift' | 'contribution'
  price: number
  description: string
  image?: string
  collected: number
  contributors: string[]
}

export default function Registry() {
  const [items, setItems] = useState<RegistryItem[]>([
    {
      id: 1,
      name: 'Robot Pâtissier KitchenAid',
      type: 'gift',
      price: 599,
      description: 'Pour réaliser de délicieuses pâtisseries maison',
      image: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      collected: 300,
      contributors: ['Famille Martin', 'Marie L.', 'Pierre D.']
    },
    {
      id: 2,
      name: 'Voyage de Noces à Bali',
      type: 'contribution',
      price: 5000,
      description: 'Participez à notre lune de miel de rêve',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      collected: 2500,
      contributors: ['Famille Dubois', 'Sophie M.', 'Jean R.', 'Claire B.', 'Thomas P.']
    }
  ])

  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null)
  const [newItem, setNewItem] = useState<Omit<RegistryItem, 'id' | 'collected' | 'contributors'>>({
    name: '',
    type: 'gift',
    price: 0,
    description: '',
    image: ''
  })

  const totalCollected = items.reduce((sum, item) => sum + item.collected, 0)
  const totalTarget = items.reduce((sum, item) => sum + item.price, 0)
  const uniqueContributors = new Set(items.flatMap(item => item.contributors)).size

  const handleAddItem = () => {
    const itemToAdd = {
      id: Math.max(0, ...items.map(i => i.id)) + 1,
      ...newItem,
      collected: 0,
      contributors: []
    }
    setItems([...items, itemToAdd])
    setNewItem({
      name: '',
      type: 'gift',
      price: 0,
      description: '',
      image: ''
    })
    setIsAddingItem(false)
  }

  const handleUpdateItem = () => {
    if (!editingItem) return
    setItems(items.map(i => i.id === editingItem.id ? editingItem : i))
    setEditingItem(null)
  }

  const handleDeleteItem = (id: number) => {
    setItems(items.filter(i => i.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Liste de mariage & Cagnotte</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez vos souhaits et suivez les contributions
          </p>
        </div>
        <button
          onClick={() => setIsAddingItem(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un souhait
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total collecté</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {totalCollected.toLocaleString()}€
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <GiftIcon className="h-8 w-8 text-pink-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Objectif total</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {totalTarget.toLocaleString()}€
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contributeurs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {uniqueContributors}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des souhaits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {item.image && (
              <div className="relative h-48">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </h3>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {item.type === 'gift' ? 'Cadeau' : 'Cagnotte'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {item.description}
              </p>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.collected.toLocaleString()}€ collectés
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.price.toLocaleString()}€
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-pink-600 h-2 rounded-full"
                    style={{ width: `${(item.collected / item.price) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {item.contributors.length} contributeur{item.contributors.length > 1 ? 's' : ''}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.contributors.map((contributor, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200"
                    >
                      {contributor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'ajout/modification */}
      {(isAddingItem || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isAddingItem ? 'Ajouter un souhait' : 'Modifier le souhait'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              isAddingItem ? handleAddItem() : handleUpdateItem()
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={isAddingItem ? newItem.name : editingItem?.name}
                    onChange={(e) => isAddingItem
                      ? setNewItem({ ...newItem, name: e.target.value })
                      : setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)
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
                    value={isAddingItem ? newItem.type : editingItem?.type}
                    onChange={(e) => isAddingItem
                      ? setNewItem({ ...newItem, type: e.target.value as 'gift' | 'contribution' })
                      : setEditingItem(prev => prev ? { ...prev, type: e.target.value as 'gift' | 'contribution' } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    <option value="gift">Cadeau</option>
                    <option value="contribution">Cagnotte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={isAddingItem ? newItem.price : editingItem?.price}
                    onChange={(e) => isAddingItem
                      ? setNewItem({ ...newItem, price: parseInt(e.target.value) })
                      : setEditingItem(prev => prev ? { ...prev, price: parseInt(e.target.value) } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={isAddingItem ? newItem.description : editingItem?.description}
                    onChange={(e) => isAddingItem
                      ? setNewItem({ ...newItem, description: e.target.value })
                      : setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={isAddingItem ? newItem.image : editingItem?.image}
                    onChange={(e) => isAddingItem
                      ? setNewItem({ ...newItem, image: e.target.value })
                      : setEditingItem(prev => prev ? { ...prev, image: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingItem(false)
                    setEditingItem(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
                >
                  {isAddingItem ? 'Ajouter' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
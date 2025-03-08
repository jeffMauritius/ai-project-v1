'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'

type Partner = {
  id: number
  name: string
  type: string
  image: string
  rating: number
  description: string
  website: string
  featured: boolean
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([
    {
      id: 1,
      name: "Traiteur Royal",
      type: "Traiteur",
      image: "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      description: "Service de traiteur haut de gamme spécialisé dans la gastronomie française.",
      website: "www.traiteur-royal.fr",
      featured: true
    },
    {
      id: 2,
      name: "Fleurs & Passion",
      type: "Fleuriste",
      image: "https://images.unsplash.com/photo-1507290439931-a861b5a38200?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
      description: "Artisan fleuriste créant des compositions uniques pour votre mariage.",
      website: "www.fleurs-passion.fr",
      featured: true
    }
  ])

  const [isAddingPartner, setIsAddingPartner] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [newPartner, setNewPartner] = useState<Omit<Partner, 'id'>>({
    name: '',
    type: '',
    image: '',
    rating: 5,
    description: '',
    website: '',
    featured: false
  })

  const handleAddPartner = () => {
    const partnerToAdd = {
      id: Math.max(0, ...partners.map(p => p.id)) + 1,
      ...newPartner
    }
    setPartners([...partners, partnerToAdd])
    setNewPartner({
      name: '',
      type: '',
      image: '',
      rating: 5,
      description: '',
      website: '',
      featured: false
    })
    setIsAddingPartner(false)
  }

  const handleUpdatePartner = () => {
    if (!editingPartner) return
    setPartners(partners.map(p => p.id === editingPartner.id ? editingPartner : p))
    setEditingPartner(null)
  }

  const handleDeletePartner = (id: number) => {
    setPartners(partners.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partenaires recommandés</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez les partenaires qui apparaîtront sur votre vitrine
          </p>
        </div>
        <button
          onClick={() => setIsAddingPartner(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un partenaire
        </button>
      </div>

      {/* Liste des partenaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((partner) => (
          <div key={partner.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="h-48 relative">
              <Image
                src={partner.image}
                alt={partner.name}
                fill
                className="object-cover"
              />
              {partner.featured && (
                <div className="absolute top-2 right-2 bg-pink-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                  Mis en avant
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {partner.name}
                  </h3>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {partner.type}
                  </p>
                </div>
                <div className="flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                  <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                    {partner.rating}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {partner.description}
              </p>
              <div className="flex justify-between items-center">
                <a
                  href={`https://${partner.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-pink-600 hover:text-pink-500"
                >
                  {partner.website}
                </a>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingPartner(partner)}
                    className="p-2 text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePartner(partner.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'ajout/modification */}
      {(isAddingPartner || editingPartner) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isAddingPartner ? 'Ajouter un partenaire' : 'Modifier le partenaire'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              isAddingPartner ? handleAddPartner() : handleUpdatePartner()
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={isAddingPartner ? newPartner.name : editingPartner?.name}
                    onChange={(e) => isAddingPartner
                      ? setNewPartner({ ...newPartner, name: e.target.value })
                      : setEditingPartner(prev => prev ? { ...prev, name: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <input
                    type="text"
                    value={isAddingPartner ? newPartner.type : editingPartner?.type}
                    onChange={(e) => isAddingPartner
                      ? setNewPartner({ ...newPartner, type: e.target.value })
                      : setEditingPartner(prev => prev ? { ...prev, type: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={isAddingPartner ? newPartner.image : editingPartner?.image}
                    onChange={(e) => isAddingPartner
                      ? setNewPartner({ ...newPartner, image: e.target.value })
                      : setEditingPartner(prev => prev ? { ...prev, image: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Note
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={isAddingPartner ? newPartner.rating : editingPartner?.rating}
                    onChange={(e) => isAddingPartner
                      ? setNewPartner({ ...newPartner, rating: parseFloat(e.target.value) })
                      : setEditingPartner(prev => prev ? { ...prev, rating: parseFloat(e.target.value) } : null)
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
                    value={isAddingPartner ? newPartner.description : editingPartner?.description}
                    onChange={(e) => isAddingPartner
                      ? setNewPartner({ ...newPartner, description: e.target.value })
                      : setEditingPartner(prev => prev ? { ...prev, description: e.target.value } : null)
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Site web
                  </label>
                  <input
                    type="text"
                    value={isAddingPartner ? newPartner.website : editingPartner?.website}
                    onChange={(e) => isAddingPartner
                      ? setNewPartner({ ...newPartner, website: e.target.value })
                      : setEditingPartner(prev => prev ? { ...prev, website: e.target.value } : null)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAddingPartner ? newPartner.featured : editingPartner?.featured}
                    onChange={(e) => isAddingPartner
                      ? setNewPartner({ ...newPartner, featured: e.target.checked })
                      : setEditingPartner(prev => prev ? { ...prev, featured: e.target.checked } : null)
                    }
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Mettre en avant ce partenaire
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPartner(false)
                    setEditingPartner(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
                >
                  {isAddingPartner ? 'Ajouter' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
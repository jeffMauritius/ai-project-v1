'use client'

import { useState } from 'react'
import { PhotoIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import { UsersIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
}) as any

type Service = {
  id: number
  name: string
  description: string
  price: string
  included: string[]
}

type Option = {
  id: number
  name: string
  price: string
  description: string
}

export default function Storefront() {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Château de Vaux-le-Vicomte',
    description: `Le Château de Vaux-le-Vicomte, joyau architectural du XVIIe siècle, vous ouvre ses portes pour faire de votre mariage un événement véritablement royal.

Situé à seulement 55 km de Paris, ce chef-d'œuvre de l'architecture classique française allie magnificence historique et confort moderne.`,
    address: '77950 Maincy, France',
    phone: '+33 1 64 14 41 90',
    email: 'events@vaux-le-vicomte.com',
    website: 'www.vaux-le-vicomte.com'
  })

  const [services, setServices] = useState<Service[]>([
    {
      id: 1,
      name: 'Formule Prestige',
      description: 'Location exclusive du château et des jardins',
      price: 'À partir de 15000€',
      included: [
        'Accès privatif au château',
        'Jardins illuminés',
        'Coordinateur dédié',
        'Vestiaires et salon privé',
        'Parking sécurisé'
      ]
    }
  ])

  const [options, setOptions] = useState<Option[]>([
    {
      id: 1,
      name: 'Feu d&apos;artifice',
      price: '3000€',
      description: 'Spectacle pyrotechnique personnalisé'
    },
    {
      id: 2,
      name: 'Voiture ancienne',
      price: '800€',
      description: 'Location d&apos;une voiture de collection avec chauffeur'
    }
  ])

  const [photos, setPhotos] = useState([
    'https://images.unsplash.com/photo-1464808322410-1a934aab61e5',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea'
  ])

  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingOption, setEditingOption] = useState<Option | null>(null)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ma vitrine</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez votre profil et vos prestations
          </p>
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
        >
          Publier les modifications
        </button>
      </div>

      {/* Informations de l'entreprise */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Informations de l&apos;entreprise
        </h2>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nom de l&apos;entreprise
            </label>
            <input
              type="text"
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <Editor
              apiKey="kt6ws4781ypwwybkvh88ueu3ywheumr483a8x5xfzgmuctr4"
              id="company-description"
              value={companyInfo.description}
              onEditorChange={(content) => setCompanyInfo({ ...companyInfo, description: content })}
              init={{
                height: 300,
                menubar: false,
                branding: false,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                skin: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'oxide-dark' : 'oxide',
                content_css: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                content_style: `
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    color: ${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#fff' : '#000'};
                    background: ${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#374151' : '#fff'};
                  }
                `,
                setup: function(editor) {
                  editor.on('init', function() {
                    editor.getBody().style.backgroundColor = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#374151' : '#fff';
                    editor.getBody().style.color = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#fff' : '#000';
                  });
                }
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Adresse
              </label>
              <input
                type="text"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Téléphone
              </label>
              <input
                type="tel"
                value={companyInfo.phone}
                onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={companyInfo.email}
                onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Site web
              </label>
              <input
                type="url"
                value={companyInfo.website}
                onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Photos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Photos</h2>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-500">
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter des photos
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <Image
                src={photo}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Services</h2>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-500">
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter un service
          </button>
        </div>
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {service.price}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingService(service)}
                    className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button className="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{service.description}</p>
              <ul className="space-y-2">
                {service.included.map((item, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Options</h2>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-500">
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter une option
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => (
            <div
              key={option.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {option.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.price}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingOption(option)}
                    className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button className="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {option.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
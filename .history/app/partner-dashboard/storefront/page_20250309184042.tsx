'use client'

import { useState } from 'react'
import { PhotoIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import { UsersIcon } from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from 'next/link'
import Image from 'next/image'

const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor as any), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
})

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
  const [showPreview, setShowPreview] = useState(false)
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
      <div className="fixed right-8 bottom-8 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Prévisualiser votre vitrine</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Modal de prévisualisation */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Prévisualisation de votre vitrine</DialogTitle>
            <DialogDescription>
              Voici comment votre vitrine apparaît aux visiteurs
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-8">
              {/* En-tête */}
              <div className="relative h-64 rounded-lg overflow-hidden">
                {photos[0] && (
                  <Image
                    src={photos[0]}
                    alt={companyInfo.name}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <div className="p-8 text-white">
                    <h1 className="text-3xl font-bold mb-2">{companyInfo.name}</h1>
                    <p className="text-lg opacity-90">{companyInfo.address}</p>
                  </div>
                </div>
              </div>

              {/* Informations */}
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-8">
                  <div className="prose dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: companyInfo.description }} />
                  </div>

                  {/* Services */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Nos services</h2>
                    <div className="space-y-4">
                      {services.map(service => (
                        <div key={service.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium">{service.name}</h3>
                              <p className="text-sm text-gray-500">{service.price}</p>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">{service.description}</p>
                          <ul className="space-y-2">
                            {service.included.map((item, index) => (
                              <li key={index} className="flex items-center text-sm">
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
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Options disponibles</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {options.map(option => (
                        <div key={option.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h3 className="font-medium mb-1">{option.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{option.price}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {option.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 sticky top-4">
                    <h2 className="text-xl font-semibold mb-4">Contact</h2>
                    <div className="space-y-4">
                      <p className="flex items-center">
                        <span className="font-medium mr-2">Téléphone:</span>
                        {companyInfo.phone}
                      </p>
                      <p className="flex items-center">
                        <span className="font-medium mr-2">Email:</span>
                        {companyInfo.email}
                      </p>
                      <p className="flex items-center">
                        <span className="font-medium mr-2">Site web:</span>
                        {companyInfo.website}
                      </p>
                    </div>
                    <Button className="w-full mt-6">
                      Contacter l&apos;établissement
                    </Button>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Photos</h2>
                <div className="grid grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              // @ts-ignore
              initialValue={companyInfo.description}
              init={{
              apiKey: "kt6ws4781ypwwybkvh88ueu3ywheumr483a8x5xfzgmuctr4",
              height: 300,
              menubar: false,
              branding: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
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
              setup: function(editor: any) {
                editor.on('init', function() {
                editor.getBody().style.backgroundColor = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#374151' : '#fff';
                editor.getBody().style.color = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#fff' : '#000';
                });
              }
              }}
              onEditorChange={(content: string) => setCompanyInfo({ ...companyInfo, description: content })}
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
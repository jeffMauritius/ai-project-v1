'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PlusIcon, FolderIcon, PhotoIcon } from '@heroicons/react/24/outline'

const mockAlbums = [
  {
    id: 1,
    name: 'Cérémonie',
    cover: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    count: 125
  },
  {
    id: 2,
    name: 'Cocktail',
    cover: 'https://images.unsplash.com/photo-1470338745628-171cf53de3a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    count: 84
  },
  {
    id: 3,
    name: 'Soirée',
    cover: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    count: 216
  }
]

export default function Photos() {
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null)
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Photos</h1>
        <div className="flex space-x-4">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <FolderIcon className="h-5 w-5 mr-2" />
            Nouvel album
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500">
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter des photos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAlbums.map((album) => (
          <div
            key={album.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden group cursor-pointer"
            onClick={() => setSelectedAlbum(album.id)}
          >
            <div className="relative h-48">
              <Image
                src={album.cover}
                alt={album.name}
                fill
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-opacity" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-lg font-medium text-white">{album.name}</h3>
                <p className="text-sm text-white text-opacity-90">
                  <PhotoIcon className="inline-block h-4 w-4 mr-1" />
                  {album.count} photos
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                    <Image
                      src={album.cover}
                      alt=""
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full text-sm text-pink-600 dark:text-pink-400 hover:text-pink-500">
                Voir toutes les photos
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
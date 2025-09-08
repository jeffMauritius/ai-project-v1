'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { PlusIcon, FolderIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGallery } from '@/components/ui/GlobalImageGallery'

interface AlbumDTO {
  id: string
  name: string
  description: string
  photos: { id: string; url: string }[]
}

const albumSchema = z.object({
  name: z.string().min(1, 'Le nom de l\'album est requis'),
  description: z.string().min(1, 'La description est requise')
})

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const photosSchema = z.object({
  albumId: z.string().min(1, 'Sélectionnez un album'),
  photos: z
    .array(z.instanceof(File))
    .min(1, 'Sélectionnez au moins une photo')
    .refine(
      files => files.every(file => file.size <= MAX_FILE_SIZE),
      'Chaque fichier doit faire moins de 2MB'
    )
    .refine(files => files.every(file => file.type.startsWith('image/')), 'Uniquement des images sont acceptées')
})

type AlbumFormValues = z.infer<typeof albumSchema>
type PhotosFormValues = z.infer<typeof photosSchema>

export default function Photos() {
  const [albums, setAlbums] = useState<AlbumDTO[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)
  const [isAlbumOpen, setIsAlbumOpen] = useState(false)
  const [isPhotosOpen, setIsPhotosOpen] = useState(false)
  const { openGallery } = useGallery()

  const {
    register: registerAlbum,
    handleSubmit: handleSubmitAlbum,
    formState: { errors: albumErrors },
    reset: resetAlbum
  } = useForm<AlbumFormValues>({
    resolver: zodResolver(albumSchema),
    defaultValues: { name: '', description: '' }
  })

  const {
    control: controlPhotos,
    handleSubmit: handleSubmitPhotos,
    formState: { errors: photosErrors },
    reset: resetPhotos,
    setValue: setPhotosValue,
    watch: watchPhotos
  } = useForm<PhotosFormValues>({
    resolver: zodResolver(photosSchema),
    defaultValues: { photos: [], albumId: '' }
  })

  const fetchAlbums = async () => {
    const res = await fetch('/api/user/photos/albums', { cache: 'no-store' })
    if (res.ok) {
      const data: AlbumDTO[] = await res.json()
      setAlbums(data)
    }
  }

  useEffect(() => {
    fetchAlbums()
  }, [])

  useEffect(() => {
    if (selectedAlbum) {
      setPhotosValue('albumId', selectedAlbum)
    }
  }, [selectedAlbum, setPhotosValue])

  const onSubmitAlbum = async (values: AlbumFormValues) => {
    const res = await fetch('/api/user/photos/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    })
    if (res.ok) {
      setIsAlbumOpen(false)
      resetAlbum()
      fetchAlbums()
    }
  }

  const onSubmitPhotos = async (values: PhotosFormValues) => {
    const formData = new FormData()
    for (const f of values.photos) formData.append('files', f)
    formData.append('albumId', values.albumId)

    const res = await fetch('/api/user/photos', {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      setIsPhotosOpen(false)
      resetPhotos({ photos: [], albumId: values.albumId })
      fetchAlbums()
    }
  }

  const handleOpenAlbum = (album: AlbumDTO) => {
    setSelectedAlbum(album.id)
    const images = album.photos.map((p) => ({ id: p.id, url: p.url }))
    if (images.length > 0) {
      openGallery(images, 0)
    }
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Photos</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsAlbumOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FolderIcon className="h-5 w-5 mr-2" />
            Nouvel album
          </button>
          <button
            onClick={() => setIsPhotosOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter des photos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => (
          <div
            key={album.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden group cursor-pointer"
            onClick={() => handleOpenAlbum(album)}
          >
            <div className="relative h-48">
              <Image
                src={album.photos[0]?.url || 'https://images.unsplash.com/photo-1517817748490-58a9360b25a7?q=80&w=800&auto=format&fit=crop'}
                alt={album.name}
                fill
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-opacity" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-lg font-medium text-white">{album.name}</h3>
                <p className="text-sm text-white text-opacity-90">
                  <PhotoIcon className="inline-block h-4 w-4 mr-1" />
                  {album.photos.length} photos
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                    <Image
                      src={album.photos[index]?.url || album.photos[0]?.url || 'https://images.unsplash.com/photo-1517817748490-58a9360b25a7?q=80&w=300&auto=format&fit=crop'}
                      alt=""
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full text-sm text-pink-600 dark:text-pink-400 hover:text-pink-500" onClick={() => handleOpenAlbum(album)}>
                Voir toutes les photos
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox: Nouvel album */}
      <Dialog open={isAlbumOpen} onOpenChange={setIsAlbumOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel album</DialogTitle>
            <DialogDescription>Créez un nouvel album en renseignant les informations ci-dessous.</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitAlbum(onSubmitAlbum)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="album-name">Nom de l&apos;album</Label>
              <Input id="album-name" placeholder="Ex: Cérémonie" {...registerAlbum('name')} />
              {albumErrors.name && (
                <p className="text-sm text-red-600">{albumErrors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="album-description">Description</Label>
              <Textarea id="album-description" placeholder="Décrivez cet album" {...registerAlbum('description')} />
              {albumErrors.description && (
                <p className="text-sm text-red-600">{albumErrors.description.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsAlbumOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer l&apos;album</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox: Ajouter des photos */}
      <Dialog open={isPhotosOpen} onOpenChange={setIsPhotosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des photos</DialogTitle>
            <DialogDescription>Importez une ou plusieurs images (max 2MB chacune).</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPhotos(onSubmitPhotos)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="album">Album</Label>
              <Controller
                name="albumId"
                control={controlPhotos}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un album" />
                    </SelectTrigger>
                    <SelectContent>
                      {albums.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {photosErrors.albumId && (
                <p className="text-sm text-red-600">{photosErrors.albumId.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="photos">Photos</Label>
              <Controller
                name="photos"
                control={controlPhotos}
                render={({ field }) => (
                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => field.onChange(Array.from(e.target.files || []))}
                  />
                )}
              />
              {photosErrors.photos && (
                <p className="text-sm text-red-600">{photosErrors.photos.message as string}</p>
              )}
              <p className="text-xs text-gray-500">Taille maximale par fichier : 2MB</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsPhotosOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
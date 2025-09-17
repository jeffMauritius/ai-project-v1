'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { PlusIcon, FolderIcon, PhotoIcon, PencilIcon } from '@heroicons/react/24/outline'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Edit3, Loader2 } from 'lucide-react'
import { useConfirmation } from '@/components/ui/confirmation-dialog'

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
  const [albumToView, setAlbumToView] = useState<AlbumDTO | null>(null)
  const [albumToEdit, setAlbumToEdit] = useState<AlbumDTO | null>(null)
  const [isAlbumOpen, setIsAlbumOpen] = useState(false)
  const [isPhotosOpen, setIsPhotosOpen] = useState(false)
  const [isAlbumGridOpen, setIsAlbumGridOpen] = useState(false)
  const [isEditAlbumOpen, setIsEditAlbumOpen] = useState(false)
<<<<<<< HEAD
  const [isUploading, setIsUploading] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
=======
>>>>>>> feature-photos
  const { showConfirmation } = useConfirmation()

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
    register: registerEditAlbum,
    handleSubmit: handleSubmitEditAlbum,
    formState: { errors: editAlbumErrors },
    reset: resetEditAlbum,
    setValue: setEditAlbumValue
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
      // Mettre à jour l'album affiché si nécessaire
      if (albumToView) {
        const refreshed = data.find(a => a.id === albumToView.id) || null
        setAlbumToView(refreshed)
      }
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

  const onSubmitEditAlbum = async (values: AlbumFormValues) => {
    if (!albumToEdit) return
    
    const res = await fetch(`/api/user/photos/albums/${albumToEdit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
<<<<<<< HEAD
=======
    })
    if (res.ok) {
      setIsEditAlbumOpen(false)
      setAlbumToEdit(null)
      resetEditAlbum()
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
>>>>>>> feature-photos
    })
    if (res.ok) {
      setIsEditAlbumOpen(false)
      setAlbumToEdit(null)
      resetEditAlbum()
      fetchAlbums()
    }
  }

<<<<<<< HEAD
  const onSubmitPhotos = async (values: PhotosFormValues) => {
    setIsUploading(true)
    try {
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
    } finally {
      setIsUploading(false)
    }
  }

  const openAlbumGrid = (album: AlbumDTO) => {
    setSelectedAlbum(album.id)
    setAlbumToView(album)
    setIsAlbumGridOpen(true)
  }

  const openEditAlbum = (album: AlbumDTO) => {
    setAlbumToEdit(album)
    setEditAlbumValue('name', album.name)
    setEditAlbumValue('description', album.description)
    setIsEditAlbumOpen(true)
  }

  const handleDeletePhoto = async (photoId: string) => {
    const confirmed = await showConfirmation({
      title: 'Supprimer la photo',
      description: 'Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive',
      onConfirm: async () => {
        setDeletingPhotoId(photoId)
        try {
          const res = await fetch(`/api/user/photos/${photoId}`, { method: 'DELETE' })
          if (res.ok) {
            // Mettre à jour localement le contenu du modal
            setAlbumToView(prev => prev ? { ...prev, photos: prev.photos.filter(p => p.id !== photoId) } : prev)
            // Rafraîchir la liste globale
            fetchAlbums()
          }
        } finally {
          setDeletingPhotoId(null)
        }
      }
    })
  }

  const handleDeleteAlbum = async (album: AlbumDTO) => {
    await showConfirmation({
=======
  const openAlbumGrid = (album: AlbumDTO) => {
    setSelectedAlbum(album.id)
    setAlbumToView(album)
    setIsAlbumGridOpen(true)
  }

  const openEditAlbum = (album: AlbumDTO) => {
    setAlbumToEdit(album)
    setEditAlbumValue('name', album.name)
    setEditAlbumValue('description', album.description)
    setIsEditAlbumOpen(true)
  }

  const handleDeletePhoto = async (photoId: string) => {
    const confirmed = await showConfirmation({
      title: 'Supprimer la photo',
      description: 'Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive'
    })

    if (!confirmed) return

    const res = await fetch(`/api/user/photos/${photoId}`, { method: 'DELETE' })
    if (res.ok) {
      // Mettre à jour localement le contenu du modal
      setAlbumToView(prev => prev ? { ...prev, photos: prev.photos.filter(p => p.id !== photoId) } : prev)
      // Rafraîchir la liste globale
      fetchAlbums()
    }
  }

  const handleDeleteAlbum = async (album: AlbumDTO) => {
    const confirmed = await showConfirmation({
>>>>>>> feature-photos
      title: 'Supprimer l\'album',
      description: `Êtes-vous sûr de vouloir supprimer l'album "${album.name}" et toutes ses ${album.photos.length} photos ? Cette action est irréversible.`,
      confirmText: 'Supprimer l\'album',
      cancelText: 'Annuler',
<<<<<<< HEAD
      variant: 'destructive',
      onConfirm: async () => {
        const res = await fetch(`/api/user/photos/albums/${album.id}`, { method: 'DELETE' })
        if (res.ok) {
          fetchAlbums()
          if (albumToView?.id === album.id) {
            setIsAlbumGridOpen(false)
            setAlbumToView(null)
          }
        }
      }
    })
=======
      variant: 'destructive'
    })

    if (!confirmed) return

    const res = await fetch(`/api/user/photos/albums/${album.id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchAlbums()
      if (albumToView?.id === album.id) {
        setIsAlbumGridOpen(false)
        setAlbumToView(null)
      }
    }
>>>>>>> feature-photos
  }

  const getAlbumCoverImage = (album: AlbumDTO) => {
    if (album.photos.length > 0) {
      return album.photos[0].url
    }
    // Placeholder pour album vide
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE5NSAxNDVIMjA1VjE1NUgxOTVWMTQ1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTg1IDE1NUgyMTVWMTY1SDE4NVYxNTVaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5BbGJ1bSB2aWRlPC90ZXh0Pgo8L3N2Zz4K'
  }

  const getAlbumThumbnailImage = (album: AlbumDTO, index: number) => {
    if (album.photos[index]) {
      return album.photos[index].url
    }
    if (album.photos.length > 0) {
      return album.photos[0].url
    }
    // Placeholder pour vignette vide
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQ1IDQ1SDU1VjU1SDQ1VjQ1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNDAgNTBINjBWNTBINDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden group cursor-pointer relative"
            onClick={() => openAlbumGrid(album)}
          >
            {/* Boutons d'action */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => { e.stopPropagation(); openEditAlbum(album) }}
<<<<<<< HEAD
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600"
=======
                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-500"
>>>>>>> feature-photos
                title="Modifier l'album"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album) }}
<<<<<<< HEAD
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600"
=======
                className="bg-red-600 text-white p-2 rounded-md hover:bg-red-500"
>>>>>>> feature-photos
                title="Supprimer l'album"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="relative h-48">
              <Image
                src={getAlbumCoverImage(album)}
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
                      src={getAlbumThumbnailImage(album, index)}
                      alt=""
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full text-sm text-pink-600 dark:text-pink-400 hover:text-pink-500" onClick={(e) => { e.stopPropagation(); openAlbumGrid(album) }}>
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

      {/* Lightbox: Modifier album */}
      <Dialog open={isEditAlbumOpen} onOpenChange={setIsEditAlbumOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;album</DialogTitle>
            <DialogDescription>Modifiez les informations de l&apos;album.</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitEditAlbum(onSubmitEditAlbum)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-album-name">Nom de l&apos;album</Label>
              <Input id="edit-album-name" placeholder="Ex: Cérémonie" {...registerEditAlbum('name')} />
              {editAlbumErrors.name && (
                <p className="text-sm text-red-600">{editAlbumErrors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-album-description">Description</Label>
              <Textarea id="edit-album-description" placeholder="Décrivez cet album" {...registerEditAlbum('description')} />
              {editAlbumErrors.description && (
                <p className="text-sm text-red-600">{editAlbumErrors.description.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsEditAlbumOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Modifier</Button>
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
                  <Select value={field.value} onValueChange={field.onChange} disabled={isUploading}>
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
                    disabled={isUploading}
                  />
                )}
              />
              {photosErrors.photos && (
                <p className="text-sm text-red-600">{photosErrors.photos.message as string}</p>
              )}
              <p className="text-xs text-gray-500">Taille maximale par fichier : 2MB</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsPhotosOpen(false)} disabled={isUploading}>
                Annuler
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox: Liste des photos de l'album */}
      <Dialog open={isAlbumGridOpen} onOpenChange={setIsAlbumGridOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{albumToView?.name || 'Album'}</DialogTitle>
            <DialogDescription>Photos de l&apos;album. Vous pouvez supprimer une photo.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albumToView?.photos?.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image src={photo.url} alt="" fill className="object-cover" />
                <button
<<<<<<< HEAD
                  className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 disabled:opacity-50"
                  onClick={() => handleDeletePhoto(photo.id)}
                  title="Supprimer la photo"
                  disabled={deletingPhotoId === photo.id}
                >
                  {deletingPhotoId === photo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
=======
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-md hover:bg-red-500"
                  onClick={() => handleDeletePhoto(photo.id)}
                  title="Supprimer la photo"
                >
                  <Trash2 className="w-4 h-4" />
>>>>>>> feature-photos
                </button>
              </div>
            ))}
            {!albumToView?.photos?.length && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="w-16 h-16 mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">Aucune photo dans cet album</p>
                <p className="text-sm">Ajoutez des photos pour commencer</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAlbumGridOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

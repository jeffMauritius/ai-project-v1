"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ImagePlus, Trash2, Upload } from "lucide-react"
import Image from "next/image"

interface Media {
  id: string
  url: string
  type: "IMAGE" | "VIDEO"
  title?: string
  description?: string
  order: number
}

export default function MediaManager() {
  const { toast } = useToast()
  const [media, setMedia] = useState<Media[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // Charger les médias existants
  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      console.log("[MediaManager] Chargement des médias")
      const response = await fetch("/api/partner-storefront/media")
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      const data = await response.json()
      console.log("[MediaManager] Médias chargés:", data)
      setMedia(data)
    } catch (error) {
      console.error("[MediaManager] Erreur lors du chargement des médias:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les médias.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("[MediaManager] Fichier sélectionné:", file.name, file.type, file.size)
      
      // Vérifier la taille du fichier (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.log("[MediaManager] Fichier trop volumineux")
        toast({
          title: "Erreur",
          description: "Le fichier est trop volumineux. Taille maximum : 10MB",
          variant: "destructive",
        })
        return
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        console.log("[MediaManager] Type de fichier non supporté")
        toast({
          title: "Erreur",
          description: "Format de fichier non supporté. Utilisez des images ou des vidéos.",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      // Réinitialiser le formulaire
      setTitle("")
      setDescription("")
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("title", title)
    formData.append("description", description)

    try {
      console.log("[MediaManager] Début de l'upload")
      const response = await fetch("/api/partner-storefront/media", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[MediaManager] Erreur de l'API:", response.status, errorText)
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`)
      }

      const newMedia = await response.json()
      console.log("[MediaManager] Média ajouté avec succès:", newMedia)
      setMedia([...media, newMedia])
      setSelectedFile(null)
      setTitle("")
      setDescription("")
      toast({
        title: "Succès",
        description: "Média ajouté avec succès.",
      })
    } catch (error) {
      console.error("[MediaManager] Erreur lors de l'upload:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le média.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (mediaId: string) => {
    try {
      console.log("[MediaManager] Suppression du média:", mediaId)
      const response = await fetch(`/api/partner-storefront/media/${mediaId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[MediaManager] Erreur de l'API:", response.status, errorText)
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`)
      }

      setMedia(media.filter((m) => m.id !== mediaId))
      toast({
        title: "Succès",
        description: "Média supprimé avec succès.",
      })
    } catch (error) {
      console.error("[MediaManager] Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le média.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un média</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Fichier</Label>
              <Input
                id="file"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground">
                Formats acceptés : images (JPG, PNG, GIF) et vidéos (MP4, WebM). Taille maximum : 10MB
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre du média"
                disabled={isUploading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du média"
                disabled={isUploading}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                "Upload en cours..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Uploader
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Médias existants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-lg overflow-hidden border"
              >
                {item.type === "IMAGE" ? (
                  <div className="aspect-video relative">
                    <Image
                      src={item.url}
                      alt={item.title || "Image"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <video
                    src={item.url}
                    className="w-full aspect-video object-cover"
                    controls
                  />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-2 bg-white/90">
                  <h3 className="font-medium">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-500">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
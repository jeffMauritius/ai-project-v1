'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, FileIcon as GoogleIcon, Facebook, Apple, Pencil, Check, X } from "lucide-react"
import { useSession, signOut } from 'next-auth/react'
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Settings() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("https://github.com/shadcn.png")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [notifications, setNotifications] = useState({
    email: {
      newMessage: true,
      newReview: true,
      newBooking: true
    },
    sms: {
      newMessage: false,
      newReview: false,
      newBooking: true
    },
    push: {
      newMessage: true,
      newReview: false,
      newBooking: true
    }
  })

  // Update avatar URL when session changes
  useEffect(() => {
    if (session?.user?.image) {
      setAvatarUrl(session.user.image)
    }
  }, [session?.user?.image])

  // Initialize email when session changes
  useEffect(() => {
    if (session?.user?.email) {
      setNewEmail(session.user.email)
    }
  }, [session?.user?.email])

  const handleSaveEmail = async () => {
    if (!newEmail || newEmail === session?.user?.email) {
      setIsEditingEmail(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide.",
        variant: "destructive",
      })
      return
    }

    setIsSavingEmail(true)
    try {
      const response = await fetch('/api/user/update-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      // Update the session with the new email
      await update({
        ...session,
        user: {
          ...session?.user,
          email: newEmail
        }
      })

      toast({
        title: "Succès",
        description: "Votre adresse email a été mise à jour avec succès.",
      })

      setIsEditingEmail(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'email:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      })
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleCancelEmailEdit = () => {
    setNewEmail(session?.user?.email || '')
    setIsEditingEmail(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Type de fichier non supporté",
        description: "Veuillez sélectionner un fichier JPG, GIF ou PNG.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille du fichier ne doit pas dépasser 1MB.",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
  }

  const handleAvatarUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Erreur lors de l\'upload')
      }

      const data = await response.json()
      
      // Update the avatar URL immediately
      setAvatarUrl(data.avatarUrl)
      
      // Update the session with the new avatar URL
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.avatarUrl
        }
      })
      
      toast({
        title: "Succès",
        description: "Votre logo a été mis à jour avec succès.",
      })

      // Close dialog and reset
      setIsUploadDialogOpen(false)
      setSelectedFile(null)
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'upload.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteEmail) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer votre adresse email pour confirmer la suppression.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: deleteEmail }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Erreur lors de la suppression du compte')
      }

      const data = await response.json()
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès. Vous allez être déconnecté et redirigé vers la page de connexion.",
      })

      // Close dialog and reset
      setIsDeleteDialogOpen(false)
      setDeleteEmail("")
      
      // Sign out the user and redirect to login page
      setTimeout(async () => {
        await signOut({ 
          redirect: true,
          callbackUrl: '/auth/login'
        })
      }, 2000)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression du compte.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Paramètres du compte</h1>
      
      {/* Informations personnelles */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mb-2">
                    Changer le logo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Changer le logo de l&apos;entreprise</DialogTitle>
                    <DialogDescription>
                      Choisissez une nouvelle image. JPG, GIF ou PNG. 1MB max.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedFile ? URL.createObjectURL(selectedFile) : avatarUrl} />
                        <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <label 
                          htmlFor="picture" 
                          className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-pink-500 dark:hover:border-pink-500"
                        >
                          <div className="space-y-1 text-center">
                            <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-semibold text-pink-600 dark:text-pink-400">
                                Cliquez pour choisir
                              </span>{' '}
                              ou glissez-déposez
                            </div>
                          </div>
                          <input
                            id="picture"
                            name="picture"
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/jpg,image/gif,image/png"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </div>
                    </div>
                    {selectedFile && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Fichier sélectionné: {selectedFile.name}</p>
                        <p>Taille: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null)
                        setIsUploadDialogOpen(false)
                      }}
                      disabled={isUploading}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAvatarUpload}
                      disabled={!selectedFile || isUploading}
                    >
                      {isUploading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                JPG, GIF ou PNG. 1MB max.
              </p>
            </div>
          </div>
          <form className="space-y-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="fullname" className="text-gray-700 dark:text-gray-300">
                  Nom complet
                </Label>
                <Input
                  id="fullname"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  value={session?.user?.name || ''}
                  disabled={true}
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    id="email"
                    type="email"
                    className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    value={isEditingEmail ? newEmail : (session?.user?.email || '')}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={!isEditingEmail || isSavingEmail}
                  />
                  {isEditingEmail ? (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleSaveEmail}
                        disabled={isSavingEmail}
                        className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Enregistrer"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEmailEdit}
                        disabled={isSavingEmail}
                        className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Annuler"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsEditingEmail(true)}
                      className="h-9 w-9 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      title="Modifier l'email"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isEditingEmail && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Entrez votre nouvelle adresse email et cliquez sur le bouton vert pour enregistrer.
                  </p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Informations de l'entreprise */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Informations de l&apos;entreprise</CardTitle>
        </CardHeader>
        <CardContent>
                      <form className="space-y-6">
              <div>
                <Label htmlFor="company-name">
                  Nom de l&apos;entreprise
                </Label>
                <Input
                  id="company-name"
                  type="text"
                  defaultValue="Château de Vaux-le-Vicomte"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="description">
                  Description
                </Label>
                <Textarea
                  id="description"
                  defaultValue="Le Château de Vaux-le-Vicomte, joyau architectural du XVIIe siècle, vous ouvre ses portes pour faire de votre mariage un événement véritablement royal."
                  disabled={!isEditing}
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="address">
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    defaultValue="77950 Maincy, France"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    defaultValue="+33 1 64 14 41 90"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="website">
                    Site web
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    defaultValue="www.vaux-le-vicomte.com"
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="mr-3"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                    >
                      Enregistrer
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </form>
        </CardContent>
      </Card>

      {/* Comptes connectés */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Comptes connectés</CardTitle>
          <CardDescription>
            Gérez les services connectés à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <GoogleIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Google</p>
                  <p className="text-sm text-gray-500">events@vaux-le-vicomte.com</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Déconnecter</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <Facebook className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Facebook</p>
                  <p className="text-sm text-gray-500">Non connecté</p>
                </div>
              </div>
              <Button size="sm">Connecter</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <Apple className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Apple</p>
                  <p className="text-sm text-gray-500">Non connecté</p>
                </div>
              </div>
              <Button size="sm">Connecter</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Email</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-messages">
                    Nouveaux messages
                  </Label>
                  <Switch
                    id="email-messages"
                    checked={notifications.email.newMessage}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      email: { ...notifications.email, newMessage: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-reviews">
                    Nouveaux avis
                  </Label>
                  <Switch
                    id="email-reviews"
                    checked={notifications.email.newReview}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      email: { ...notifications.email, newReview: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-bookings">
                    Nouvelles réservations
                  </Label>
                  <Switch
                    id="email-bookings"
                    checked={notifications.email.newBooking}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      email: { ...notifications.email, newBooking: checked }
                    })}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">SMS</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-messages">
                    Nouveaux messages
                  </Label>
                  <Switch
                    id="sms-messages"
                    checked={notifications.sms.newMessage}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      sms: { ...notifications.sms, newMessage: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-reviews">
                    Nouveaux avis
                  </Label>
                  <Switch
                    id="sms-reviews"
                    checked={notifications.sms.newReview}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      sms: { ...notifications.sms, newReview: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-bookings">
                    Nouvelles réservations
                  </Label>
                  <Switch
                    id="sms-bookings"
                    checked={notifications.sms.newBooking}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      sms: { ...notifications.sms, newBooking: checked }
                    })}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Notifications push</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-messages">
                    Nouveaux messages
                  </Label>
                  <Switch
                    id="push-messages"
                    checked={notifications.push.newMessage}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      push: { ...notifications.push, newMessage: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-reviews">
                    Nouveaux avis
                  </Label>
                  <Switch
                    id="push-reviews"
                    checked={notifications.push.newReview}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      push: { ...notifications.push, newReview: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-bookings">
                    Nouvelles réservations
                  </Label>
                  <Switch
                    id="push-bookings"
                    checked={notifications.push.newBooking}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      push: { ...notifications.push, newBooking: checked }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppression du compte */}
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Suppression du compte</CardTitle>
          <CardDescription>
            Attention : cette action est irréversible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              La suppression de votre compte entraînera la perte définitive de :
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>Toutes vos informations d&apos;entreprise</li>
              <li>Votre historique de messages et conversations</li>
              <li>Vos statistiques et analyses</li>
              <li>Vos avis clients</li>
            </ul>
            <div className="pt-4">
              <Button 
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Supprimer mon compte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmation de suppression de compte */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Confirmer la suppression du compte
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-email" className="text-gray-700 dark:text-gray-300">
                Confirmez votre adresse email
              </Label>
              <Input
                id="delete-email"
                type="email"
                placeholder="Entrez votre adresse email"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pour confirmer la suppression, veuillez entrer votre adresse email : <strong>{session?.user?.email}</strong>
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
                ⚠️ Attention : Cette action supprimera définitivement :
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                <li>• Toutes vos informations d&apos;entreprise</li>
                <li>• Votre historique de messages et conversations</li>
                <li>• Vos statistiques et analyses</li>
                <li>• Vos avis clients</li>
                <li>• Toutes vos données de profil</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeleteEmail("")
              }}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!deleteEmail || isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
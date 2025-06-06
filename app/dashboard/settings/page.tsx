'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, FileIcon as GoogleIcon, Facebook, Apple } from "lucide-react"
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
  const [isEditing, setIsEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("https://github.com/shadcn.png")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mb-2">
                    Changer la photo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Changer la photo de profil</DialogTitle>
                    <DialogDescription>
                      Choisissez une nouvelle photo de profil. JPG, GIF ou PNG. 1MB max.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedFile ? URL.createObjectURL(selectedFile) : avatarUrl} />
                        <AvatarFallback>JD</AvatarFallback>
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
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) setSelectedFile(file)
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null)
                        setIsUploadDialogOpen(false)
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedFile) {
                          setAvatarUrl(URL.createObjectURL(selectedFile))
                          setIsUploadDialogOpen(false)
                          setSelectedFile(null)
                        }
                      }}
                      disabled={!selectedFile}
                    >
                      Enregistrer
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstname" className="text-gray-700 dark:text-gray-300">
                Prénom
              </Label>
              <Input
                id="firstname"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                defaultValue="John"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="lastname" className="text-gray-700 dark:text-gray-300">
                Nom
              </Label>
              <Input
                id="lastname"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                defaultValue="Doe"
                disabled={!isEditing}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                defaultValue="john.doe@example.com"
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
                  <p className="text-sm text-gray-500">john.doe@gmail.com</p>
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
                <Label htmlFor="email-messages" className="text-gray-700 dark:text-gray-300">
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
                <Label htmlFor="email-reviews" className="text-gray-700 dark:text-gray-300">
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
                <Label htmlFor="email-bookings" className="text-gray-700 dark:text-gray-300">
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
                <Label htmlFor="sms-messages" className="text-gray-700 dark:text-gray-300">
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
                <Label htmlFor="sms-reviews" className="text-gray-700 dark:text-gray-300">
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
                <Label htmlFor="sms-bookings" className="text-gray-700 dark:text-gray-300">
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
                <Label htmlFor="push-messages" className="text-gray-700 dark:text-gray-300">
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
                <Label htmlFor="push-reviews" className="text-gray-700 dark:text-gray-300">
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
                <Label htmlFor="push-bookings" className="text-gray-700 dark:text-gray-300">
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

      {/* Données personnelles */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Données personnelles</CardTitle>
          <CardDescription>
            Gérez vos données personnelles et vos préférences de confidentialité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Préférences de confidentialité</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="profile-visibility" className="flex-1">
                    Profil public
                    <span className="block text-sm text-gray-500">
                      Permettre aux autres utilisateurs de voir votre profil
                    </span>
                  </Label>
                  <Switch
                    id="profile-visibility"
                    defaultChecked={true}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="search-visibility" className="flex-1">
                    Apparaître dans les recherches
                    <span className="block text-sm text-gray-500">
                      Permettre aux autres utilisateurs de vous trouver dans les recherches
                    </span>
                  </Label>
                  <Switch
                    id="search-visibility"
                    defaultChecked={true}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="activity-visibility" className="flex-1">
                    Activité visible
                    <span className="block text-sm text-gray-500">
                      Permettre aux autres utilisateurs de voir votre activité
                    </span>
                  </Label>
                  <Switch
                    id="activity-visibility"
                    defaultChecked={false}
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Exportation des données</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Téléchargez une copie de vos données personnelles au format JSON.
                    Le fichier contiendra toutes vos informations, messages et préférences.
                  </p>
                  <Button variant="outline">
                    Exporter mes données
                  </Button>
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
              <li>Toutes vos informations personnelles</li>
              <li>Votre historique de messages et conversations</li>
              <li>Vos préférences et paramètres</li>
              <li>Vos listes et favoris</li>
            </ul>
            <div className="pt-4">
              <Button 
                variant="destructive"
                className="w-full sm:w-auto"
              >
                Supprimer mon compte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}
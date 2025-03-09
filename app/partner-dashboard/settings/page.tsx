'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
      
      {/* Informations de l'entreprise */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Informations de l&apos;entreprise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>CV</AvatarFallback>
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
                        <AvatarFallback>CV</AvatarFallback>
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
                <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="events@vaux-le-vicomte.com"
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
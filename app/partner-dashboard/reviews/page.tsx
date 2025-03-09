'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Filter, CheckCircle, XCircle, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Review = {
  id: number
  author: string
  rating: number
  date: string
  content: string
  response?: string
  status: 'pending' | 'approved' | 'rejected'
}

const mockReviews: Review[] = [
  {
    id: 1,
    author: 'Sophie M.',
    rating: 5,
    date: '2024-01-15',
    content: 'Service exceptionnel ! L\'équipe a été très professionnelle et à l\'écoute de nos besoins. Je recommande vivement.',
    response: 'Merci beaucoup Sophie pour votre retour ! C\'était un plaisir de participer à votre mariage.',
    status: 'approved'
  },
  {
    id: 2,
    author: 'Pierre D.',
    rating: 4,
    date: '2024-01-14',
    content: 'Très bonne prestation globale. Quelques petits détails à améliorer mais rien de majeur.',
    status: 'pending'
  },
  {
    id: 3,
    author: 'Marie L.',
    rating: 5,
    date: '2024-01-10',
    content: 'Tout était parfait ! De la préparation jusqu\'au jour J, nous avons été enchantés par le professionnalisme.',
    response: 'Merci Marie ! Nous sommes ravis d\'avoir contribué à rendre votre journée spéciale.',
    status: 'approved'
  }
]

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [response, setResponse] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
  const totalReviews = reviews.length
  const approvedReviews = reviews.filter(r => r.status === 'approved').length
  const pendingReviews = reviews.filter(r => r.status === 'pending').length

  const handleApprove = (id: number) => {
    setReviews(reviews.map(review => 
      review.id === id ? { ...review, status: 'approved' } : review
    ))
  }

  const handleReject = (id: number) => {
    setReviews(reviews.map(review => 
      review.id === id ? { ...review, status: 'rejected' } : review
    ))
  }

  const handleRespond = () => {
    if (!selectedReview || !response) return
    setReviews(reviews.map(review => 
      review.id === selectedReview.id ? { ...review, response } : review
    ))
    setSelectedReview(null)
    setResponse('')
  }

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(review => review.status === filter)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Avis clients
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez et répondez aux avis de vos clients
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Note moyenne</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {averageRating.toFixed(1)}/5
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total des avis</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {totalReviews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avis approuvés</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {approvedReviews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {pendingReviews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filter === 'all' ? 'Tous les avis' :
                   filter === 'pending' ? 'En attente' :
                   filter === 'approved' ? 'Approuvés' :
                   'Rejetés'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  Tous les avis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('pending')}>
                  En attente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('approved')}>
                  Approuvés
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('rejected')}>
                  Rejetés
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Liste des avis */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {review.author}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      review.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      review.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {review.status === 'approved' ? 'Approuvé' :
                       review.status === 'rejected' ? 'Rejeté' :
                       'En attente'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(review.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {review.content}
              </p>
              {review.response && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Votre réponse :
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {review.response}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                {review.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(review.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleApprove(review.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                  </>
                )}
                {!review.response && (
                  <Button
                    variant="default"
                    onClick={() => setSelectedReview(review)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Répondre
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de réponse */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre à l&apos;avis</DialogTitle>
            <DialogDescription>
              Votre réponse sera visible publiquement sur votre profil.
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedReview.author}
                  </p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: selectedReview.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedReview.content}
                </p>
              </div>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Votre réponse..."
                className="min-h-[100px]"
              />
            </>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReview(null)
                setResponse('')
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRespond}
              disabled={!response.trim()}
            >
              Publier la réponse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
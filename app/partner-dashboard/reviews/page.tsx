'use client'

import { useState } from 'react'
import { StarIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

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
    content: 'Service exceptionnel ! L&apos;équipe a été très professionnelle et à l&apos;écoute de nos besoins. Je recommande vivement.',
    response: 'Merci beaucoup Sophie pour votre retour ! C&apos;était un plaisir de participer à votre mariage.',
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
    content: 'Tout était parfait ! De la préparation jusqu&apos;au jour J, nous avons été enchantés par le professionnalisme.',
    response: 'Merci Marie ! Nous sommes ravis d&apos;avoir contribué à rendre votre journée spéciale.',
    status: 'approved'
  }
]

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [response, setResponse] = useState('')

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <StarIcon className="h-8 w-8 text-yellow-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Note moyenne</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {averageRating.toFixed(1)}/5
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChatBubbleLeftIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total des avis</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {totalReviews}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avis approuvés</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {approvedReviews}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {pendingReviews}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {reviews.map((review) => (
            <li key={review.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900 dark:text-white">{review.author}</p>
                      <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <time className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.date).toLocaleDateString()}
                    </time>
                  </div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{review.content}</p>
                  {review.response && (
                    <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Votre réponse :
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{review.response}</p>
                    </div>
                  )}
                </div>
                <div className="ml-6 flex items-center space-x-2">
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                      >
                        <CheckCircleIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                      >
                        <XCircleIcon className="h-6 w-6" />
                      </button>
                    </>
                  )}
                  {!review.response && (
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                    >
                      <ChatBubbleLeftIcon className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal de réponse */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Répondre à l&apos;avis
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">{selectedReview.content}</p>
            </div>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white mb-4"
              placeholder="Votre réponse..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedReview(null)
                  setResponse('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
              >
                Annuler
              </button>
              <button
                onClick={handleRespond}
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
              >
                Répondre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useRef, useEffect } from 'react'
import { PlusIcon, TrashIcon, BanknotesIcon, CalendarIcon, PencilIcon } from '@heroicons/react/24/outline'
import { z } from 'zod'
import { useWeddingProviders, type WeddingProvider, type ProviderFormData } from '@/hooks/useWeddingProviders'
import { useToast } from '@/hooks/useToast'
import { useSession } from 'next-auth/react'

// Fonction pour valider le format de date française dd/mm/yyyy
const validateFrenchDate = (dateStr: string): boolean => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = dateStr.match(regex)
  
  if (!match) return false
  
  const [, day, month, year] = match
  const dayNum = parseInt(day, 10)
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)
  
  // Vérifier les limites
  if (monthNum < 1 || monthNum > 12) return false
  if (dayNum < 1 || dayNum > 31) return false
  if (yearNum < 1900 || yearNum > 2100) return false
  
  // Créer une date et vérifier qu'elle est valide
  const date = new Date(yearNum, monthNum - 1, dayNum)
  return date.getDate() === dayNum && date.getMonth() === monthNum - 1 && date.getFullYear() === yearNum
}

// Fonction pour convertir dd/mm/yyyy vers yyyy-mm-dd (format ISO)
const frenchDateToISO = (frenchDate: string): string => {
  if (!validateFrenchDate(frenchDate)) return ''
  const [day, month, year] = frenchDate.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Fonction pour convertir yyyy-mm-dd vers dd/mm/yyyy
const isoDateToFrench = (isoDate: string): string => {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

// Schema de validation Zod avec validation de date française
const providerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  type: z.string().min(1, 'Veuillez sélectionner un type'),
  date: z.string()
    .min(1, 'La date est obligatoire')
    .refine(validateFrenchDate, 'Format de date invalide (dd/mm/yyyy)'),
  status: z.enum(['confirmed', 'pending', 'cancelled']),
  price: z.string().min(1, 'Le prix est obligatoire').regex(/^\d+(\.\d{1,2})?$/, 'Format de prix invalide'),
  deposit: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Format d\'acompte invalide'),
  notes: z.string()
})

// Liste complète des types de prestataires du système
const providerTypes = [
  { id: 'venues', name: 'Lieux de réception' },
  { id: 'caterers', name: 'Traiteurs' },
  { id: 'photographers', name: 'Photographes' },
  { id: 'videographers', name: 'Vidéastes' },
  { id: 'florists', name: 'Fleuristes' },
  { id: 'decorators', name: 'Décorateurs' },
  { id: 'music-vendors', name: 'Musiciens & DJ' },
  { id: 'entertainment', name: 'Animation' },
  { id: 'beauty', name: 'Beauté & Coiffure' },
  { id: 'dresses', name: 'Robes de mariée' },
  { id: 'suits', name: 'Costumes' },
  { id: 'jewelry', name: 'Bijoux' },
  { id: 'invitations', name: 'Faire-part' },
  { id: 'wedding-cakes', name: 'Wedding cakes' },
  { id: 'wine-spirits', name: 'Vins & Spiritueux' },
  { id: 'transport', name: 'Transport' },
  { id: 'gifts', name: 'Cadeaux d\'invités' },
  { id: 'honeymoon', name: 'Voyage de noces' },
  { id: 'officiants', name: 'Officiants' },
  { id: 'organization', name: 'Wedding planner' }
]

// Fonction pour formater la date en français pour l'affichage
const formatDateToFrench = (dateString: string) => {
  if (!dateString) return ''
  
  // Si c'est déjà au format français, on le convertit d'abord en ISO
  const isoDate = dateString.includes('/') ? frenchDateToISO(dateString) : dateString
  
  if (!isoDate) return dateString
  
  const date = new Date(isoDate)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Fonction pour parser le prix string en number pour les calculs
const parsePrice = (priceStr: string): number => {
  return parseFloat(priceStr) || 0
}

// Composant DatePicker personnalisé
const DatePicker = ({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Convertir la valeur française en Date
  useEffect(() => {
    if (value && validateFrenchDate(value)) {
      const isoDate = frenchDateToISO(value)
      setSelectedDate(new Date(isoDate))
    } else {
      setSelectedDate(null)
    }
  }, [value])

  // Fermer le calendrier si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const frenchDate = isoDateToFrench(date.toISOString().split('T')[0])
    onChange(frenchDate)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // Auto-formatage : ajouter les / automatiquement
    inputValue = inputValue.replace(/\D/g, '') // Garder seulement les chiffres
    if (inputValue.length >= 2) {
      inputValue = inputValue.substring(0, 2) + '/' + inputValue.substring(2)
    }
    if (inputValue.length >= 5) {
      inputValue = inputValue.substring(0, 5) + '/' + inputValue.substring(5, 9)
    }
    
    onChange(inputValue)
  }

  const generateCalendar = () => {
    const today = new Date()
    const currentMonth = selectedDate || today
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className={`w-full rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
            error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="dd/mm/yyyy"
          maxLength={10}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <CalendarIcon className="h-5 w-5" />
        </button>
      </div>
      
      {isOpen && (
        <div
          ref={calendarRef}
          className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(selectedDate || new Date())
                newDate.setMonth(newDate.getMonth() - 1)
                setSelectedDate(newDate)
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              ←
            </button>
            <span className="font-medium text-gray-900 dark:text-white">
              {monthNames[selectedDate?.getMonth() || new Date().getMonth()]} {selectedDate?.getFullYear() || new Date().getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(selectedDate || new Date())
                newDate.setMonth(newDate.getMonth() + 1)
                setSelectedDate(newDate)
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              →
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 p-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {generateCalendar().map((date, index) => {
              const isCurrentMonth = date.getMonth() === (selectedDate?.getMonth() || new Date().getMonth())
              const isToday = date.toDateString() === new Date().toDateString()
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`
                    p-2 text-sm rounded hover:bg-pink-100 dark:hover:bg-pink-900
                    ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                    ${isToday ? 'bg-pink-200 dark:bg-pink-800 font-bold' : ''}
                    ${isSelected ? 'bg-pink-500 text-white' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Planning() {
  const { data: session, status } = useSession()
  const { providers, loading, error, addProvider, deleteProvider, updateProvider } = useWeddingProviders()
  const { toast } = useToast()
  
  const [isAddingProvider, setIsAddingProvider] = useState(false)
  const [isEditingProvider, setIsEditingProvider] = useState(false)
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null)
  const [newProvider, setNewProvider] = useState<ProviderFormData>({
    name: '',
    type: 'venues',
    date: '',
    status: 'pending',
    price: '',
    deposit: '0',
    notes: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Calculs du budget avec conversion string -> number
  const totalBudget = providers.reduce((sum, provider) => sum + parsePrice(provider.price), 0)
  const totalPaid = providers.reduce((sum, provider) => sum + parsePrice(provider.deposit), 0)
  const remaining = totalBudget - totalPaid

  const validateForm = () => {
    try {
      providerSchema.parse(newProvider)
      setFormErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message
          }
        })
        setFormErrors(errors)
      }
      return false
    }
  }

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const success = await addProvider(newProvider)
    
    if (success) {
      setNewProvider({
        name: '',
        type: 'venues',
        date: '',
        status: 'pending',
        price: '',
        deposit: '0',
        notes: ''
      })
      setFormErrors({})
      setIsAddingProvider(false)
      toast({
        title: 'Succès',
        description: 'Prestataire ajouté avec succès',
        variant: 'default'
      })
    } else {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'ajout du prestataire',
        variant: 'destructive'
      })
    }
  }

  const handleEditProvider = (provider: WeddingProvider) => {
    setEditingProviderId(provider.id)
    setNewProvider({
      name: provider.name,
      type: provider.type,
      date: provider.date,
      status: provider.status,
      price: provider.price,
      deposit: provider.deposit,
      notes: provider.notes
    })
    setIsEditingProvider(true)
    setFormErrors({})
  }

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !editingProviderId) {
      return
    }

    const success = await updateProvider(editingProviderId, newProvider)
    
    if (success) {
      setNewProvider({
        name: '',
        type: 'venues',
        date: '',
        status: 'pending',
        price: '',
        deposit: '0',
        notes: ''
      })
      setFormErrors({})
      setIsEditingProvider(false)
      setEditingProviderId(null)
      toast({
        title: 'Succès',
        description: 'Prestataire modifié avec succès',
        variant: 'default'
      })
    } else {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la modification du prestataire',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteProvider = async (id: string) => {
    const success = await deleteProvider(id)
    
    if (success) {
      toast({
        title: 'Succès',
        description: 'Prestataire supprimé avec succès',
        variant: 'default'
      })
    } else {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression du prestataire',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setNewProvider({
      name: '',
      type: 'venues',
      date: '',
      status: 'pending',
      price: '',
      deposit: '0',
      notes: ''
    })
    setFormErrors({})
    setIsAddingProvider(false)
    setIsEditingProvider(false)
    setEditingProviderId(null)
  }

  // Affichage du loading de session
  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement de la session...</p>
          </div>
        </div>
      </div>
    )
  }

  // Affichage si non authentifié
  if (status === 'unauthenticated') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            Non authentifié
          </h3>
          <p className="text-red-600 dark:text-red-400">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  // Affichage du loading des prestataires
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement de vos prestataires...</p>
          </div>
        </div>
      </div>
    )
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organisation du mariage</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez vos prestataires et votre budget
          </p>
        </div>
        <button
          onClick={() => setIsAddingProvider(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un prestataire
        </button>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget total</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalBudget.toLocaleString('fr-FR')}€</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Déjà payé</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalPaid.toLocaleString('fr-FR')}€</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-pink-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reste à payer</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{remaining.toLocaleString('fr-FR')}€</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Timeline des prestataires</h2>
        
        {providers.length === 0 ? (
          <div className="text-center py-12">
            <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun prestataire ajouté
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Commencez par ajouter vos premiers prestataires pour organiser votre mariage.
            </p>
            <button
              onClick={() => setIsAddingProvider(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter votre premier prestataire
            </button>
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {providers.sort((a, b) => {
                // Convertir les dates françaises en ISO pour le tri
                const dateA = frenchDateToISO(a.date)
                const dateB = frenchDateToISO(b.date)
                return new Date(dateA).getTime() - new Date(dateB).getTime()
              }).map((provider, providerIdx) => (
                <li key={provider.id}>
                  <div className="relative pb-8">
                    {providerIdx !== providers.length - 1 ? (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-900 ${
                          provider.status === 'confirmed'
                            ? 'bg-green-500'
                            : provider.status === 'pending'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}>
                          <span className="text-white text-sm">{providerTypes.find(t => t.id === provider.type)?.name[0] || '?'}</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {provider.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {providerTypes.find(t => t.id === provider.type)?.name || provider.type}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditProvider(provider)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                              title="Modifier le prestataire"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProvider(provider.id)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                              title="Supprimer le prestataire"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Date : {formatDateToFrench(provider.date)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Prix : {parsePrice(provider.price).toLocaleString('fr-FR')}€ (Acompte : {parsePrice(provider.deposit).toLocaleString('fr-FR')}€)
                          </p>
                          {provider.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              {provider.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modal d'ajout/édition avec validation Zod */}
      {(isAddingProvider || isEditingProvider) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isEditingProvider ? 'Modifier le prestataire' : 'Ajouter un prestataire'}
            </h3>
            <form onSubmit={isEditingProvider ? handleUpdateProvider : handleAddProvider}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom du prestataire *
                  </label>
                  <input
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                      formErrors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ex: Château de Versailles"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type de prestataire *
                  </label>
                  <select
                    value={newProvider.type}
                    onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                      formErrors.type ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {providerTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  {formErrors.type && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date du service (dd/mm/yyyy) *
                  </label>
                  <DatePicker
                    value={newProvider.date}
                    onChange={(value) => setNewProvider({ ...newProvider, date: value })}
                    error={formErrors.date}
                  />
                  {formErrors.date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statut
                  </label>
                  <select
                    value={newProvider.status}
                    onChange={(e) => setNewProvider({ ...newProvider, status: e.target.value as WeddingProvider['status'] })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prix total (€) *
                  </label>
                  <input
                    type="text"
                    value={newProvider.price}
                    onChange={(e) => setNewProvider({ ...newProvider, price: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                      formErrors.price ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ex: 15000 ou 15000.50"
                  />
                  {formErrors.price && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Acompte versé (€)
                  </label>
                  <input
                    type="text"
                    value={newProvider.deposit}
                    onChange={(e) => setNewProvider({ ...newProvider, deposit: e.target.value })}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                      formErrors.deposit ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ex: 5000 ou 5000.50"
                  />
                  {formErrors.deposit && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.deposit}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <textarea
                    value={newProvider.notes}
                    onChange={(e) => setNewProvider({ ...newProvider, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Notes additionnelles..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md shadow-sm"
                >
                  {isEditingProvider ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

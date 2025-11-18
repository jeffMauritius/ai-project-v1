'use client'

import { useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, UserPlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { z } from 'zod'
import { useGuests, type GuestGroup, type Guest } from '@/hooks/useGuests'

// Schémas de validation Zod
const guestGroupSchema = z.object({
  name: z.string().min(1, 'Le nom du groupe est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  type: z.enum(['family', 'friends', 'colleagues', 'other'], {
    required_error: 'Veuillez sélectionner un type'
  }),
  count: z.number().min(1, 'Le nombre doit être au moins 1').max(100, 'Le nombre ne peut pas dépasser 100'),
  confirmed: z.boolean(),
  notes: z.string().max(500, 'Les notes ne peuvent pas dépasser 500 caractères').default('')
})

const individualGuestSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  lastName: z.string().min(1, 'Le nom est requis').max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  email: z.string().email('Veuillez entrer une adresse email valide'),
  groupId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'declined'], {
    required_error: 'Veuillez sélectionner un statut'
  })
})

type GuestGroupFormData = z.infer<typeof guestGroupSchema>
type IndividualGuestFormData = z.infer<typeof individualGuestSchema>

const guestTypes = [
  { id: 'family', name: 'Famille' },
  { id: 'friends', name: 'Amis' },
  { id: 'colleagues', name: 'Collègues' },
  { id: 'other', name: 'Autres' }
]

const statusOptions = [
  { id: 'pending', name: 'En attente' },
  { id: 'confirmed', name: 'Confirmé' },
  { id: 'declined', name: 'Décliné' }
]

export default function Guests() {
  const {
    guestGroups,
    individualGuests,
    loading,
    saving,
    createGuestGroup,
    updateGuestGroup,
    deleteGuestGroup,
    createIndividualGuest,
    updateIndividualGuest,
    deleteIndividualGuest
  } = useGuests()

  // États pour les formulaires
  const [newGuest, setNewGuest] = useState<Omit<GuestGroup, 'id' | 'createdAt' | 'updatedAt' | 'guests'>>({
    name: '',
    type: 'family',
    count: 1,
    confirmed: false,
    notes: ''
  })

  const [newIndividualGuest, setNewIndividualGuest] = useState<Omit<Guest, 'id' | 'createdAt' | 'updatedAt' | 'group'>>({
    firstName: '',
    lastName: '',
    email: '',
    status: 'pending',
    groupId: ''
  })

  // États pour la validation
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({})
  const [individualErrors, setIndividualErrors] = useState<Record<string, string>>({})

  // États pour les modales
  const [isAddingGuest, setIsAddingGuest] = useState(false)
  const [editingGuest, setEditingGuest] = useState<GuestGroup | null>(null)
  const [isAddingIndividualGuest, setIsAddingIndividualGuest] = useState(false)
  const [editingIndividualGuest, setEditingIndividualGuest] = useState<Guest | null>(null)
  const [isCreatingGroupInline, setIsCreatingGroupInline] = useState(false)
  const [quickGroupName, setQuickGroupName] = useState('')

  // États pour la modal de confirmation de suppression
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    type: 'group' | 'individual'
    item: GuestGroup | Guest | null
    title: string
    message: string
    canDelete: boolean
  }>({
    isOpen: false,
    type: 'group',
    item: null,
    title: '',
    message: '',
    canDelete: true
  })

  // États pour les animations de suppression
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set())

  // Fonction pour réinitialiser le formulaire de groupe
  const resetGroupForm = () => {
    setNewGuest({
      name: '',
      type: 'family',
      count: 1,
      confirmed: false,
      notes: ''
    })
    setGroupErrors({})
  }

  // Fonction pour réinitialiser le formulaire d'invité individuel
  const resetIndividualForm = () => {
    setNewIndividualGuest({
      firstName: '',
      lastName: '',
      email: '',
      status: 'pending',
      groupId: ''
    })
    setIndividualErrors({})
  }

  // Gestionnaire de soumission du formulaire de groupe
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validatedData = guestGroupSchema.parse(newGuest)
      
      if (editingGuest) {
        const result = await updateGuestGroup(editingGuest.id, validatedData)
        if (!result) return
        setEditingGuest(null)
      } else {
        const result = await createGuestGroup(validatedData)
        if (!result) return
      }
      
      setIsAddingGuest(false)
      resetGroupForm()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path) {
            errors[err.path[0]] = err.message
          }
        })
        setGroupErrors(errors)
      }
    }
  }

  // Gestionnaire pour créer un groupe rapidement
  const handleQuickCreateGroup = async (groupName: string) => {
    if (!groupName.trim()) {
      return null
    }

    const newGroupData = {
      name: groupName.trim(),
      type: 'other' as const,
      count: 5, // Valeur par défaut
      confirmed: false,
      notes: ''
    }

    const createdGroup = await createGuestGroup(newGroupData)
    if (createdGroup) {
      setNewIndividualGuest({ ...newIndividualGuest, groupId: createdGroup.id })
      setIsCreatingGroupInline(false)
      return createdGroup.id
    }
    return null
  }

  // Gestionnaire de soumission du formulaire d'invité individuel
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validatedData = individualGuestSchema.parse(newIndividualGuest)
      
      // Vérifier la limite du groupe avant d'ajouter un invité
      // Vérifier que le groupe n'a pas atteint sa limite d'invités (seulement si un groupe est sélectionné)
      if (!editingIndividualGuest && validatedData.groupId) {
        const selectedGroup = guestGroups.find(group => group.id === validatedData.groupId)
        if (selectedGroup) {
          const currentGuestCount = individualGuests.filter(guest => guest.groupId === selectedGroup.id).length
          if (currentGuestCount >= selectedGroup.count) {
            setIndividualErrors({
              groupId: `Ce groupe a atteint sa limite de ${selectedGroup.count} invités. Impossible d'ajouter un invité supplémentaire.`
            })
            return
          }
        }
      }
      
      if (editingIndividualGuest) {
        const result = await updateIndividualGuest(editingIndividualGuest.id, validatedData)
        if (!result) return
        setEditingIndividualGuest(null)
      } else {
        const result = await createIndividualGuest(validatedData)
        if (!result) return
      }
      
      setIsAddingIndividualGuest(false)
      resetIndividualForm()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path) {
            errors[err.path[0]] = err.message
          }
        })
        setIndividualErrors(errors)
      }
    }
  }

  // Fonction pour éditer un groupe
  const handleEditGroup = (guest: GuestGroup) => {
    setEditingGuest(guest)
    setNewGuest({
      name: guest.name,
      type: guest.type,
      count: guest.count,
      confirmed: guest.confirmed,
      notes: guest.notes
    })
    setIsAddingGuest(true)
  }

  // Fonction pour éditer un invité individuel
  const handleEditIndividual = (guest: Guest) => {
    setEditingIndividualGuest(guest)
    setNewIndividualGuest({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      status: guest.status,
      groupId: guest.groupId
    })
    setIsAddingIndividualGuest(true)
  }

  // Fonction pour supprimer un groupe
  const handleDeleteGroup = async (group: GuestGroup) => {
    // Vérifier s'il y a des invités dans ce groupe
    const guestsInGroup = individualGuests.filter(guest => guest.groupId === group.id)
    
    if (guestsInGroup.length > 0) {
      // Empêcher la suppression et informer l'utilisateur
      const guestList = guestsInGroup.map(guest => `${guest.firstName} ${guest.lastName}`).join(', ')
      setDeleteModal({
        isOpen: true,
        type: 'group',
        item: group,
        title: 'Impossible de supprimer le groupe',
        message: `Le groupe "${group.name}" contient ${guestsInGroup.length} invité(s) : ${guestList}. Veuillez d'abord supprimer tous les invités de ce groupe avant de pouvoir supprimer le groupe.`,
        canDelete: false
      })
    } else {
      // Permettre la suppression si aucun invité
      setDeleteModal({
        isOpen: true,
        type: 'group',
        item: group,
        title: 'Supprimer le groupe',
        message: `Êtes-vous sûr de vouloir supprimer le groupe "${group.name}" ?`,
        canDelete: true
      })
    }
  }

  // Fonction pour supprimer un invité individuel
  const handleDeleteIndividual = async (guest: Guest) => {
    setDeleteModal({
      isOpen: true,
      type: 'individual',
      item: guest,
      title: 'Supprimer l\'invité',
      message: `Êtes-vous sûr de vouloir supprimer ${guest.firstName} ${guest.lastName} ?`,
      canDelete: true
    })
  }

  // Fonction pour confirmer la suppression
  const confirmDelete = async () => {
    if (!deleteModal.item) return

    // Si c'est un groupe qui contient des invités, on ne fait rien (juste fermer la modal)
    if (deleteModal.type === 'group') {
      const guestsInGroup = individualGuests.filter(guest => guest.groupId === deleteModal.item!.id)
      if (guestsInGroup.length > 0) {
        setDeleteModal({ isOpen: false, type: 'group', item: null, title: '', message: '', canDelete: true })
        return
      }
    }

    try {
      // Ajouter l'élément à la liste des éléments en cours de suppression
      setDeletingItems(prev => new Set(prev).add(deleteModal.item!.id))
      
      let success = false
      
      if (deleteModal.type === 'group') {
        const result = await deleteGuestGroup(deleteModal.item.id)
        success = Boolean(result)
      } else {
        const result = await deleteIndividualGuest(deleteModal.item.id)
        success = Boolean(result)
      }

      if (success) {
        setDeleteModal({ isOpen: false, type: 'group', item: null, title: '', message: '', canDelete: true })
        // Retirer l'élément de la liste après un délai pour l'animation
        setTimeout(() => {
          setDeletingItems(prev => {
            const newSet = new Set(prev)
            newSet.delete(deleteModal.item!.id)
            return newSet
          })
        }, 300)
      } else {
        // En cas d'échec, retirer immédiatement de la liste
        setDeletingItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(deleteModal.item!.id)
          return newSet
        })
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      // En cas d'erreur, retirer immédiatement de la liste
      setDeletingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(deleteModal.item!.id)
        return newSet
      })
    }
  }

  // Fonction pour annuler la suppression
  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, type: 'group', item: null, title: '', message: '', canDelete: true })
  }

  // Fonction pour obtenir le nom du groupe
  const getGroupName = (groupId: string) => {
    const group = guestGroups.find(g => g.id === groupId)
    return group ? group.name : 'Groupe inconnu'
  }

  // Calculs pour les statistiques
  const totalGuests = individualGuests.length
  const confirmedGuests = individualGuests.filter(guest => guest.status === 'confirmed').length

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Invités</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invités</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {confirmedGuests} confirmés sur {totalGuests} invités au total
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              resetGroupForm()
              setEditingGuest(null)
              setIsAddingGuest(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500"
            disabled={saving}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter un groupe
          </button>
          <div className="relative group">
            <button
              onClick={() => {
                resetIndividualForm()
                setEditingIndividualGuest(null)
                setIsAddingIndividualGuest(true)
              }}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                guestGroups.length === 0
                  ? 'bg-gray-400 cursor-not-allowed opacity-50 text-white'
                  : 'bg-pink-600 hover:bg-pink-500 text-white'
              }`}
              disabled={saving || guestGroups.length === 0}
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Ajouter un invité
            </button>
            {guestGroups.length === 0 && (
              <div className="absolute bottom-full mb-2 left-0 bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Créez d&apos;abord un groupe pour organiser vos invités
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message d'aide si aucun groupe */}
      {guestGroups.length === 0 && (
        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-2">
                Commencez par créer un groupe
              </h3>
              <p className="text-blue-800 dark:text-blue-300 mb-4">
                Pour mieux organiser vos invités, nous vous recommandons de créer d&apos;abord des groupes (Famille, Amis, Collègues, etc.).
                Vous pourrez ensuite ajouter vos invités individuels dans ces groupes.
              </p>
              <button
                onClick={() => {
                  resetGroupForm()
                  setEditingGuest(null)
                  setIsAddingGuest(true)
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Créer mon premier groupe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {guestTypes.map(type => {
          const typeGuests = guestGroups.filter(g => g.type === type.id)
          const typeCount = typeGuests.reduce((sum, g) => {
            const actualGuestCount = individualGuests.filter(ig => ig.groupId === g.id).length
            return sum + actualGuestCount
          }, 0)
          const typeConfirmed = typeGuests.reduce((sum, g) => {
            const confirmedGuests = individualGuests.filter(ig => ig.groupId === g.id && ig.status === 'confirmed').length
            return sum + confirmedGuests
          }, 0)
          
          return (
            <div key={type.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{type.name}</h3>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {typeConfirmed}/{typeCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">invités confirmés</p>
            </div>
          )
        })}
      </div>

      {/* Liste des groupes */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Groupe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {guestGroups.map((guest) => (
              <tr 
                key={guest.id}
                className={`transition-all duration-300 ${
                  deletingItems.has(guest.id) 
                    ? 'opacity-0 scale-95 -translate-x-4 bg-red-50 dark:bg-red-900/10' 
                    : 'opacity-100 scale-100 translate-x-0'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {guest.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {guestTypes.find(t => t.id === guest.type)?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {individualGuests.filter(g => g.groupId === guest.id).length} / {guest.count} personnes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    guest.confirmed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {guest.confirmed ? 'Confirmé' : 'En attente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {guest.notes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditGroup(guest)}
                    className="text-pink-600 hover:text-pink-900 dark:hover:text-pink-400 mr-3 p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 hover:scale-110 transform"
                    disabled={saving}
                    title="Modifier le groupe"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(guest)}
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-110 transform"
                    disabled={saving}
                    title="Supprimer le groupe"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Liste des invités individuels */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Liste des invités</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Groupe
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {individualGuests.map((guest) => (
              <tr 
                key={guest.id}
                className={`transition-all duration-300 ${
                  deletingItems.has(guest.id) 
                    ? 'opacity-0 scale-95 -translate-x-4 bg-red-50 dark:bg-red-900/10' 
                    : 'opacity-100 scale-100 translate-x-0'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {guest.firstName} {guest.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {guest.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {getGroupName(guest.groupId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    guest.status === 'confirmed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : guest.status === 'declined'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {statusOptions.find(s => s.id === guest.status)?.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditIndividual(guest)}
                    className="text-pink-600 hover:text-pink-900 dark:hover:text-pink-400 mr-3 p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 hover:scale-110 transform"
                    disabled={saving}
                    title="Modifier l'invité"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteIndividual(guest)}
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-110 transform"
                    disabled={saving}
                    title="Supprimer l'invité"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Ajout/Édition Groupe */}
      {isAddingGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingGuest ? 'Modifier le groupe' : 'Ajouter un groupe'}
            </h3>
            
            <form onSubmit={handleGroupSubmit} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      groupErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ex: Famille Martin"
                  />
                  {groupErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{groupErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newGuest.type}
                    onChange={(e) => setNewGuest({ ...newGuest, type: e.target.value as any })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      groupErrors.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {guestTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {groupErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{groupErrors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre d&apos;invités
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newGuest.count}
                    onChange={(e) => setNewGuest({ ...newGuest, count: parseInt(e.target.value) || 1 })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      groupErrors.count ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {groupErrors.count && (
                    <p className="text-red-500 text-sm mt-1">{groupErrors.count}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newGuest.notes}
                    onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                    placeholder="Notes optionnelles..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="confirmed"
                    checked={newGuest.confirmed}
                    onChange={(e) => setNewGuest({ ...newGuest, confirmed: e.target.checked })}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="confirmed" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Groupe confirmé
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGuest(false)
                    resetGroupForm()
                    setEditingGuest(null)
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Sauvegarde...' : (editingGuest ? 'Modifier' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajout/Édition Invité Individuel */}
      {isAddingIndividualGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingIndividualGuest ? 'Modifier l\'invité' : 'Ajouter un invité'}
            </h3>
            
            <form onSubmit={handleIndividualSubmit} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={newIndividualGuest.firstName}
                    onChange={(e) => setNewIndividualGuest({ ...newIndividualGuest, firstName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      individualErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Prénom"
                  />
                  {individualErrors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{individualErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={newIndividualGuest.lastName}
                    onChange={(e) => setNewIndividualGuest({ ...newIndividualGuest, lastName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      individualErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Nom"
                  />
                  {individualErrors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{individualErrors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newIndividualGuest.email}
                    onChange={(e) => setNewIndividualGuest({ ...newIndividualGuest, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      individualErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="email@exemple.com"
                  />
                  {individualErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{individualErrors.email}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Groupe (optionnel)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingGroupInline(!isCreatingGroupInline)}
                      className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                    >
                      <PlusIcon className="h-3 w-3" />
                      {isCreatingGroupInline ? 'Annuler' : 'Créer un groupe'}
                    </button>
                  </div>

                  {isCreatingGroupInline ? (
                    <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nom du nouveau groupe"
                          value={quickGroupName}
                          onChange={(e) => setQuickGroupName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              await handleQuickCreateGroup(quickGroupName)
                              setQuickGroupName('')
                            } else if (e.key === 'Escape') {
                              setIsCreatingGroupInline(false)
                              setQuickGroupName('')
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await handleQuickCreateGroup(quickGroupName)
                            setQuickGroupName('')
                          }}
                          className="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                          disabled={!quickGroupName.trim() || saving}
                        >
                          {saving ? '...' : 'Créer'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Le groupe sera créé avec 5 invités par défaut (type: Autres)
                      </p>
                    </div>
                  ) : (
                    <select
                      value={newIndividualGuest.groupId}
                      onChange={(e) => setNewIndividualGuest({ ...newIndividualGuest, groupId: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        individualErrors.groupId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Aucun groupe</option>
                      {guestGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {individualErrors.groupId && (
                    <p className="text-red-500 text-sm mt-1">{individualErrors.groupId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={newIndividualGuest.status}
                    onChange={(e) => setNewIndividualGuest({ ...newIndividualGuest, status: e.target.value as any })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      individualErrors.status ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                  {individualErrors.status && (
                    <p className="text-red-500 text-sm mt-1">{individualErrors.status}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingIndividualGuest(false)
                    resetIndividualForm()
                    setEditingIndividualGuest(null)
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Sauvegarde...' : (editingIndividualGuest ? 'Modifier' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmation de Suppression */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md mx-4 transform animate-in zoom-in-95 duration-200">
            <div className="flex justify-center items-center mb-6">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full animate-ping ${
                  deleteModal.canDelete 
                    ? 'bg-red-100 dark:bg-red-900/20' 
                    : 'bg-yellow-100 dark:bg-yellow-900/20'
                }`}></div>
                <ExclamationTriangleIcon className={`h-16 w-16 relative z-10 ${
                  deleteModal.canDelete 
                    ? 'text-red-500' 
                    : 'text-yellow-500'
                }`} />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {deleteModal.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {deleteModal.message}
              </p>
            </div>
            
                        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cancelDelete}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
              >
                {deleteModal.canDelete ? 'Annuler' : 'Compris'}
              </button>
              {deleteModal.canDelete && (
                <button
                  onClick={confirmDelete}
                  disabled={saving}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all duration-200 hover:shadow-md hover:scale-105 transform flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
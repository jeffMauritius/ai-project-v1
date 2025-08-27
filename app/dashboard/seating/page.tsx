'use client'

import { useState, useRef, useEffect } from 'react'
import { PlusIcon, MinusIcon, UserIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, DragEndEvent, DragStartEvent, useDroppable, UniqueIdentifier } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { SortableGuest } from './SortableGuest'
import { motion, AnimatePresence } from 'framer-motion'
import { useGuests, type Guest as GuestData } from '@/hooks/useGuests'
import { useTables, type Table as TableData } from '@/hooks/useTables'

type Table = {
  id: string
  name: string
  seats: number
  guests: string[]
}

type Guest = {
  id: string
  name: string
  group: string
  status: 'unassigned' | 'assigned'
  tableId: string | null
}

// Type pour les invités avec données de table
type SeatingGuest = Omit<Guest, 'tableId'> & {
  tableId: string | null
  originalGuest: GuestData
}

const DroppableTable = ({ table, isFull, activeId, onRemove, children }: {
  table: Table
  isFull: boolean
  activeId: UniqueIdentifier | null
  onRemove: (table: Table) => void
  children: React.ReactNode
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `table-${table.id}`,
    disabled: isFull
  })

  return (
    <div
      ref={setNodeRef}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 relative group transition-all duration-200 ${
        isFull ? 'opacity-50 cursor-not-allowed' : ''
      } ${isOver && !isFull ? 'ring-2 ring-pink-500' : ''} ${
        activeId && !isFull ? 'ring-1 ring-pink-500/30' : ''
      }`}
    >
      {children}
    </div>
  )
}

export default function Seating() {
  // Récupérer les vrais invités depuis le hook
  const { individualGuests, guestGroups, loading: guestsLoading } = useGuests()
  
  // Récupérer les tables depuis le hook
  const { 
    tables: dbTables, 
    loading: tablesLoading, 
    saving, 
    createTable, 
    deleteTable, 
    canDeleteTable,
    addGuestToTable, 
    removeGuestFromTable: removeGuestFromTableDB 
  } = useTables()

  // Convertir les tables de la DB en format local
  const [tables, setTables] = useState<Table[]>([])

  // Convertir les vrais invités en format pour le plan de table
  const [guests, setGuests] = useState<SeatingGuest[]>([])

  const [isAddingTable, setIsAddingTable] = useState(false)
  const [newTableSeats, setNewTableSeats] = useState(8)
  const [newTableName, setNewTableName] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(true)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null)

  // États pour la modal de confirmation de suppression de table
  const [deleteTableModal, setDeleteTableModal] = useState<{
    isOpen: boolean
    table: Table | null
    title: string
    message: string
    canDelete: boolean
  }>({
    isOpen: false,
    table: null,
    title: '',
    message: '',
    canDelete: true
  })

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
    const guest = guests.find(g => g.id === event.active.id)
    if (guest) {
      setDraggedGuest(guest)
    }
    setShowTooltip(false)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !active || !over.id) {
      setActiveId(null)
      setDraggedGuest(null)
      return
    }

    const guestId = active.id.toString()
    const tableId = over.id.toString().replace('table-', '')

    const guest = guests.find(g => g.id === guestId)
    const targetTable = tables.find(t => t.id === tableId)

    if (!guest || !targetTable || targetTable.guests.length >= targetTable.seats) {
      setActiveId(null)
      setDraggedGuest(null)
      return
    }

    // Ajouter l'invité à la table via l'API
    const success = await addGuestToTable(tableId, guest.name)
    
    // Les états locaux seront mis à jour automatiquement via les useEffect
    // après que les données de la DB soient rafraîchies

    setDraggedGuest(null)
  }

  const handleAddTable = async () => {
    const success = await createTable({
      name: newTableName || `Table ${tables.length + 1}`,
      seats: newTableSeats
    })
    
    if (success) {
      setIsAddingTable(false)
      setNewTableSeats(8)
      setNewTableName('')
    }
  }

  const removeTable = async (table: Table) => {
    // Vérifier si la table contient des invités
    if (table.guests.length > 0) {
      // Empêcher la suppression et informer l'utilisateur
      setDeleteTableModal({
        isOpen: true,
        table: table,
        title: 'Impossible de supprimer la table',
        message: `La table "${table.name}" contient ${table.guests.length} invité(s). Veuillez d'abord retirer tous les invités de cette table avant de pouvoir la supprimer.`,
        canDelete: false
      })
    } else {
      // Permettre la suppression si aucun invité
      setDeleteTableModal({
        isOpen: true,
        table: table,
        title: 'Supprimer la table',
        message: `Êtes-vous sûr de vouloir supprimer la table "${table.name}" ?`,
        canDelete: true
      })
    }
  }

  const removeGuestFromTable = async (tableId: string, guestName: string) => {
    const success = await removeGuestFromTableDB(tableId, guestName)
    
    // Les états locaux seront mis à jour automatiquement via les useEffect
    // après que les données de la DB soient rafraîchies
  }

  // Fonction pour confirmer la suppression de table
  const confirmDeleteTable = async () => {
    if (!deleteTableModal.table) return

    // Si la table contient des invités, on ne fait rien (juste fermer la modal)
    if (deleteTableModal.table.guests.length > 0) {
      setDeleteTableModal({ isOpen: false, table: null, title: '', message: '', canDelete: true })
      return
    }

    const success = await deleteTable(deleteTableModal.table.id)
    if (success) {
      setDeleteTableModal({ isOpen: false, table: null, title: '', message: '', canDelete: true })
    }
  }

  // Fonction pour annuler la suppression de table
  const cancelDeleteTable = () => {
    setDeleteTableModal({ isOpen: false, table: null, title: '', message: '', canDelete: true })
  }

  // Convertir les tables de la DB en format local
  useEffect(() => {
    if (!tablesLoading) {
      if (dbTables.length > 0) {
        const convertedTables: Table[] = dbTables.map(table => ({
          id: table.id,
          name: table.name,
          seats: table.seats,
          guests: table.guests
        }))
        setTables(convertedTables)
      } else {
        setTables([])
      }
    }
  }, [dbTables, tablesLoading])

  // Convertir les vrais invités en format pour le plan de table
  useEffect(() => {
    if (!guestsLoading && !tablesLoading && individualGuests.length > 0) {
      const convertedGuests: SeatingGuest[] = individualGuests.map(guest => {
        // Trouver le nom du groupe
        const group = guestGroups.find(g => g.id === guest.groupId)
        const groupName = group ? group.name : 'Groupe inconnu'
        
        const guestName = `${guest.firstName} ${guest.lastName}`
        
        // Vérifier si cet invité est déjà assigné à une table
        let assignedTableId: string | null = null
        let status: 'unassigned' | 'assigned' = 'unassigned'
        
        for (const table of dbTables) {
          if (table.guests.includes(guestName)) {
            assignedTableId = table.id
            status = 'assigned'
            break
          }
        }
        
        return {
          id: guest.id,
          name: guestName,
          group: groupName,
          status,
          tableId: assignedTableId,
          originalGuest: guest
        }
      })
      
      setGuests(convertedGuests)
    }
  }, [individualGuests, guestGroups, guestsLoading, tablesLoading, dbTables])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setIsAddingTable(false)
      }
    }

    if (isAddingTable) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAddingTable])

  return (
    <DndContext
      sensors={sensors}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex h-[calc(100vh-9rem)]">
        {/* Liste des invités */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-lg overflow-hidden border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Invités non placés
                {!guestsLoading && !tablesLoading && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({guests.filter(g => g.status === 'unassigned').length})
                  </span>
                )}
              </h2>
            </div>
            
            {guestsLoading || tablesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : guests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <UserIcon className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">Aucun invité trouvé</p>
                <p className="text-sm text-center mt-2">Ajoutez des invités dans la section "Invités"</p>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {showTooltip && guests.filter(g => g.status === 'unassigned').length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute top-20 left-4 right-4 bg-pink-600 text-white p-4 rounded-lg shadow-lg z-10"
                      onClick={() => setShowTooltip(false)}
                    >
                      <p className="text-sm">
                        ✨ Glissez-déposez les invités sur les tables pour les placer
                      </p>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-pink-600 rotate-45"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <SortableContext items={guests.filter(g => g.status === 'unassigned').map(g => g.id)}>
                  <div className="overflow-y-auto h-full p-4">
                    {guests.filter(g => g.status === 'unassigned').map((guest) => (
                      <SortableGuest key={guest.id} guest={guest} />
                    ))}
                  </div>
                </SortableContext>
              </>
            )}
          </div>

          {/* Plan de table */}
          <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan de table</h1>
              {!guestsLoading && !tablesLoading && (
                <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Total invités: {guests.length}</span>
                  <span>Placés: {guests.filter(g => g.status === 'assigned').length}</span>
                  <span>Non placés: {guests.filter(g => g.status === 'unassigned').length}</span>
                  <span>Tables: {tables.length}</span>
                </div>
              )}
            </div>
            {activeId && (
              <DragOverlay>
                {guests.find(g => g.id === activeId) && (
                  <SortableGuest guest={guests.find(g => g.id === activeId)!} />
                )}
              </DragOverlay>
            )}
            <button
              onClick={() => setIsAddingTable(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter une table
            </button>
          </div>

          {/* Modal d'ajout de table */}
          {isAddingTable && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                ref={dialogRef}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Nouvelle table
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom de la table
                    </label>
                    <input
                      type="text"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      placeholder="Ex: Table des mariés"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de places
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTableSeats}
                    onChange={(e) => setNewTableSeats(parseInt(e.target.value))}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsAddingTable(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                    disabled={saving}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddTable}
                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => {
              const isFull = table.guests.length >= table.seats
              
              return (
                <DroppableTable
                  key={table.id}
                  table={table}
                  isFull={isFull}
                  activeId={activeId}
                  onRemove={removeTable}
                >
                      <button
                        onClick={() => removeTable(table)}
                        className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                      
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {table.name}
                        </h3>
                        <p className={`text-sm ${
                          isFull 
                            ? 'text-red-600 dark:text-red-400 font-medium' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {table.guests.length}/{table.seats} places
                          {isFull && ' - Table pleine'}
                        </p>
                      </div>

                      <div className="relative w-48 h-48 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-pink-200 dark:border-pink-900 rounded-full"></div>
                        {[...Array(table.seats)].map((_, index) => {
                          const angle = (index * 360) / table.seats
                          const radius = 20
                          const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
                          const y = 50 + radius * Math.sin((angle * Math.PI) / 180)
                          
                          return (
                            <div
                              key={index}
                              className="absolute w-4 h-4 bg-pink-600 dark:bg-pink-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                              }}
                            />
                          )
                        })}
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Invités assignés :
                        </h4>
                        {table.guests.map((guestName, index) => {
                          // Trouver l'invité correspondant
                          const guest = guests.find(g => g.name === guestName)
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 group"
                            >
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <span className="h-1.5 w-1.5 bg-pink-600 dark:bg-pink-400 rounded-full flex-shrink-0"></span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 dark:text-white truncate">
                                    {guestName}
                                  </div>
                                  {guest && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {guest.group}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeGuestFromTable(table.id, guestName)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 dark:hover:text-red-400 ml-2 flex-shrink-0"
                                  title="Retirer de la table"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {table.guests.length}/{table.seats} places occupées
                        </p>
                      </div>
                    </DroppableTable>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal de Confirmation de Suppression de Table */}
      {deleteTableModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md mx-4 transform animate-in zoom-in-95 duration-200">
            <div className="flex justify-center items-center mb-6">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full animate-ping ${
                  deleteTableModal.canDelete 
                    ? 'bg-red-100 dark:bg-red-900/20' 
                    : 'bg-yellow-100 dark:bg-yellow-900/20'
                }`}></div>
                <ExclamationTriangleIcon className={`h-16 w-16 relative z-10 ${
                  deleteTableModal.canDelete 
                    ? 'text-red-500' 
                    : 'text-yellow-500'
                }`} />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {deleteTableModal.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {deleteTableModal.message}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cancelDeleteTable}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
              >
                {deleteTableModal.canDelete ? 'Annuler' : 'Compris'}
              </button>
              {deleteTableModal.canDelete && (
                <button
                  onClick={confirmDeleteTable}
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
    </DndContext>
  )
}
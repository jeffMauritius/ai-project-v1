'use client'

import { useState, useRef, useEffect } from 'react'
import { PlusIcon, MinusIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline'
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, DragEndEvent, DragStartEvent, useDroppable, UniqueIdentifier } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { SortableGuest } from './SortableGuest'
import { motion, AnimatePresence } from 'framer-motion'

type Table = {
  id: number
  number: number
  name: string
  seats: number
  guests: string[]
}

type Guest = {
  id: string
  name: string
  group: string
  status: 'unassigned' | 'assigned'
  tableId: number | null
}

const DroppableTable = ({ table, isFull, activeId, onRemove, children }: {
  table: Table
  isFull: boolean
  activeId: UniqueIdentifier | null
  onRemove: (id: number) => void
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
  const [tables, setTables] = useState<Table[]>([
    { id: 1, number: 1, name: 'Table des mariés', seats: 8, guests: ['Famille de la mariée', 'Parents', 'Grands-parents'] },
    { id: 2, number: 2, name: 'Table famille', seats: 8, guests: ['Famille du marié', 'Oncles et tantes'] },
    { id: 3, number: 3, name: 'Table amis', seats: 6, guests: [] }
  ])

  const [guests, setGuests] = useState<Guest[]>([
    { id: '1', name: 'Marie Martin', group: 'Famille', status: 'unassigned', tableId: null },
    { id: '2', name: 'Pierre Dubois', group: 'Amis', status: 'unassigned', tableId: null },
    { id: '3', name: 'Sophie Leroy', group: 'Collègues', status: 'unassigned', tableId: null },
    { id: '4', name: 'Jean Dupont', group: 'Famille', status: 'unassigned', tableId: null },
    { id: '5', name: 'Claire Bernard', group: 'Amis', status: 'unassigned', tableId: null }
  ])

  const [isAddingTable, setIsAddingTable] = useState(false)
  const [newTableSeats, setNewTableSeats] = useState(8)
  const [newTableName, setNewTableName] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null)

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !active || !over.id) {
      setActiveId(null)
      setDraggedGuest(null)
      return
    }

    const guestId = active.id.toString()
    const tableId = parseInt(over.id.toString().replace('table-', ''))

    const guest = guests.find(g => g.id === guestId)
    const targetTable = tables.find(t => t.id === tableId)

    if (!guest || !targetTable || targetTable.guests.length >= targetTable.seats) {
      setActiveId(null)
      setDraggedGuest(null)
      return
    }

    // Update table guests
    setTables(tables.map(table => {
      if (table.id === tableId) {
        return {
          ...table,
          guests: [...table.guests, guest.name]
        }
      }
      return table
    }))

    // Update guest status
    setGuests(guests.map(g => {
      if (g.id === active.id) {
        return {
          ...g,
          status: 'assigned',
          tableId
        }
      }
      return g
    }))

    setDraggedGuest(null)
  }

  const handleAddTable = () => {
    const newTable: Table = {
      id: Math.max(0, ...tables.map(t => t.id)) + 1,
      number: tables.length + 1,
      name: newTableName || `Table ${tables.length + 1}`,
      seats: newTableSeats,
      guests: []
    }
    setTables([...tables, newTable])
    setIsAddingTable(false)
    setNewTableSeats(8)
    setNewTableName('')
  }

  const removeTable = (id: number) => {
    setTables(tables.filter(table => table.id !== id))
  }

  const removeGuestFromTable = (tableId: number, guestName: string) => {
    setTables(tables.map(table => {
      if (table.id === tableId) {
        return {
          ...table,
          guests: table.guests.filter(g => g !== guestName)
        }
      }
      return table
    }))

    setGuests(guests.map(guest => {
      if (guest.name === guestName) {
        return { ...guest, status: 'unassigned' }
      }
      return guest
    }))
  }

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
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Invités non placés</h2>
            </div>
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
          </div>

          {/* Plan de table */}
          <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan de table</h1>
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
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddTable}
                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
                  >
                    Ajouter
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
                        onClick={() => removeTable(table.id)}
                        className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                      
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {table.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {table.seats} places
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
                        {table.guests.map((guest, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 group"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="h-1.5 w-1.5 bg-pink-600 dark:bg-pink-400 rounded-full"></span>
                              <span>{guest}</span>
                              <button
                                onClick={() => removeGuestFromTable(table.id, guest)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 dark:hover:text-red-400 ml-2"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
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
    </DndContext>
  )
}
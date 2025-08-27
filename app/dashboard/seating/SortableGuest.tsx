import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { UserIcon } from '@heroicons/react/24/outline'

type Guest = {
  id: string
  name: string
  group: string
  status: 'unassigned' | 'assigned',
  tableId: string | null
}

export function SortableGuest({ guest }: { guest: Guest }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: guest.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        zIndex: isDragging ? 999 : 'auto'
      }}
      {...attributes}
      {...listeners}
      className={`p-4 mb-2 rounded-lg bg-gray-50 dark:bg-gray-700 ${
        isDragging ? 'shadow-lg ring-2 ring-pink-500 rotate-3 scale-105' : 'hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:ring-2 hover:ring-pink-500/50'
      } flex items-center gap-3 cursor-move`}
    >
      <UserIcon className="h-5 w-5 text-gray-400" />
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{guest.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{guest.group}</p>
      </div>
    </div>
  )
}
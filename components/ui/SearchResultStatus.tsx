'use client'

import { Heart, Eye, Calendar, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResultStatusProps {
  status: string
  className?: string
}

export function SearchResultStatus({ status, className }: SearchResultStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Sauvegardé':
        return {
          icon: Heart,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          label: 'Sauvegardé'
        }
      case 'Contacté':
        return {
          icon: CheckCircle,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          label: 'Contacté'
        }
      case 'Rendez-vous prévu':
        return {
          icon: Calendar,
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          label: 'Rendez-vous prévu'
        }
      case 'Devis reçu':
        return {
          icon: CheckCircle,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          label: 'Devis reçu'
        }
      default:
        return {
          icon: Eye,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          label: 'Consulté'
        }
    }
  }

  const config = getStatusConfig(status)
  const IconComponent = config.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      config.color,
      config.bgColor,
      className
    )}>
      <IconComponent className="h-3 w-3" />
      {config.label}
    </span>
  )
} 
import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, CreditCard, X } from "lucide-react"

interface SubscriptionErrorAlertProps {
  isOpen: boolean
  onClose: () => void
  errorType: 'existing_subscription' | 'payment_error' | 'general_error'
  errorMessage?: string
  onAction?: () => void
  actionLabel?: string
}

export function SubscriptionErrorAlert({
  isOpen,
  onClose,
  errorType,
  errorMessage,
  onAction,
  actionLabel
}: SubscriptionErrorAlertProps) {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'existing_subscription':
        return {
          title: "⚠️ Abonnement existant",
          description: "Vous avez déjà un abonnement actif. Vous pouvez modifier votre plan actuel ou annuler votre abonnement existant avant d'en créer un nouveau.",
          icon: <CreditCard className="h-6 w-6 text-orange-500" />,
          actionLabel: actionLabel || "Gérer mon abonnement"
        }
      case 'payment_error':
        return {
          title: "❌ Erreur de paiement",
          description: errorMessage || "Une erreur s'est produite lors du traitement du paiement. Veuillez vérifier vos informations de paiement et réessayer.",
          icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
          actionLabel: actionLabel || "Réessayer"
        }
      case 'general_error':
      default:
        return {
          title: "❌ Erreur",
          description: errorMessage || "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
          icon: <X className="h-6 w-6 text-red-500" />,
          actionLabel: actionLabel || "Fermer"
        }
    }
  }

  const config = getErrorConfig()

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            {config.icon}
            <AlertDialogTitle className="text-left">
              {config.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left text-sm leading-relaxed">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Fermer
          </AlertDialogCancel>
          {onAction && (
            <AlertDialogAction onClick={onAction}>
              {config.actionLabel}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 
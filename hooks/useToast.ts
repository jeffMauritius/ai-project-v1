import { toast } from '@/components/ui/use-toast'

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface AlertOptions {
  errorType: 'existing_subscription' | 'payment_error' | 'general_error'
  errorMessage?: string
  onAction?: () => void
  actionLabel?: string
}

export const useToast = () => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    toast({
      title: options?.title || "✅ Succès",
      description: message,
      variant: options?.variant || "default",
      duration: options?.duration || 5000,
    })
  }

  const showError = (message: string, options?: ToastOptions) => {
    toast({
      title: options?.title || "❌ Erreur",
      description: message,
      variant: "destructive",
      duration: options?.duration || 7000,
    })
  }

  const showWarning = (message: string, options?: ToastOptions) => {
    toast({
      title: options?.title || "⚠️ Attention",
      description: message,
      variant: options?.variant || "default",
      duration: options?.duration || 6000,
    })
  }

  const showInfo = (message: string, options?: ToastOptions) => {
    toast({
      title: options?.title || "ℹ️ Information",
      description: message,
      variant: options?.variant || "default",
      duration: options?.duration || 4000,
    })
  }

  const showSubscriptionError = (errorMessage: string) => {
    if (errorMessage.includes("Un abonnement actif existe déjà")) {
      showWarning(
        "Vous avez déjà un abonnement actif. Vous pouvez modifier votre plan actuel ou annuler votre abonnement existant.",
        {
          title: "⚠️ Abonnement existant",
          duration: 8000
        }
      )
    } else {
      showError(errorMessage, {
        title: "❌ Erreur d'abonnement"
      })
    }
  }

  const showSubscriptionAlert = (options: AlertOptions) => {
    // Cette fonction retourne les props pour le composant SubscriptionErrorAlert
    return {
      errorType: options.errorType,
      errorMessage: options.errorMessage,
      onAction: options.onAction,
      actionLabel: options.actionLabel
    }
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSubscriptionError,
    showSubscriptionAlert,
    toast
  }
} 
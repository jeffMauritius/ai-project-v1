'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react'

interface SubscriptionChangeDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  currentPlan: {
    name: string
    price: number
    billingInterval: string
  }
  newPlan: {
    name: string
    price: number
    billingInterval: string
  }
  loading?: boolean
}

export function SubscriptionChangeDialog({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  loading = false
}: SubscriptionChangeDialogProps) {
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning')

  const handleConfirm = () => {
    if (step === 'warning') {
      setStep('confirmation')
    } else {
      onConfirm()
    }
  }

  const handleClose = () => {
    setStep('warning')
    onClose()
  }

  const formatPrice = (price: number, interval: string) => {
    const intervalText = interval === 'YEARLY' ? '/an' : '/mois'
    return `${price}€${intervalText}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'warning' ? (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Changement d&apos;abonnement
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Confirmer le changement
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'warning' 
              ? 'Vous êtes sur le point de changer votre formule d\'abonnement.'
              : 'Veuillez confirmer votre nouveau choix d\'abonnement.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'warning' ? (
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                    Important à savoir
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Votre abonnement actuel sera remplacé par le nouveau plan</li>
                    <li>• Vous bénéficierez d&apos;une nouvelle période d&apos;essai de 14 jours</li>
                    <li>• Les fonctionnalités de votre plan actuel resteront disponibles jusqu&apos;à la fin de la période</li>
                    <li>• Le changement prendra effet immédiatement</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Plan actuel</h3>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                  {currentPlan.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatPrice(currentPlan.price, currentPlan.billingInterval)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-1">Nouveau plan</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {newPlan.name}
                </p>
                <p className="text-sm text-blue-500">
                  {formatPrice(newPlan.price, newPlan.billingInterval)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Changement confirmé
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Vous allez passer du plan <strong>{currentPlan.name}</strong> au plan <strong>{newPlan.name}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{currentPlan.name}</span>
              <ArrowRight className="h-4 w-4" />
              <span className="font-medium text-blue-600 dark:text-blue-400">{newPlan.name}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Traitement...
              </>
            ) : step === 'warning' ? (
              'Continuer'
            ) : (
              'Confirmer le changement'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

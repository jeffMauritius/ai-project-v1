'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmationDialogContextType {
  showConfirmation: (options: ConfirmationOptions) => Promise<boolean>
}

interface ConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  onConfirm?: () => Promise<void> | void
}

const ConfirmationDialogContext = createContext<ConfirmationDialogContextType | undefined>(undefined)

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: '',
    description: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'default'
  })
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const showConfirmation = (confirmationOptions: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(confirmationOptions)
      setResolvePromise(() => resolve)
      setIsOpen(true)
      setIsLoading(false)
    })
  }

  const handleConfirm = async () => {
    if (options.onConfirm) {
      setIsLoading(true)
      try {
        await options.onConfirm()
        setIsOpen(false)
        resolvePromise?.(true)
      } catch (error) {
        console.error('Confirmation action failed:', error)
        // Keep dialog open on error
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsOpen(false)
      resolvePromise?.(true)
    }
    setResolvePromise(null)
  }

  const handleCancel = () => {
    if (isLoading) return // Prevent canceling during loading
    setIsOpen(false)
    resolvePromise?.(false)
    setResolvePromise(null)
  }

  return (
    <ConfirmationDialogContext.Provider value={{ showConfirmation }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              {options.variant === 'destructive' && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <DialogTitle>{options.title}</DialogTitle>
            </div>
            <DialogDescription>{options.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              {options.cancelText}
            </Button>
            <Button 
              variant={options.variant === 'destructive' ? 'destructive' : 'default'} 
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                options.confirmText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmationDialogContext.Provider>
  )
}

export function useConfirmation() {
  const context = useContext(ConfirmationDialogContext)
  if (context === undefined) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider')
  }
  return context
}

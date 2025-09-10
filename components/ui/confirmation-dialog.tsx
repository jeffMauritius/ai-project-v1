'use client'

import { useState, createContext, useContext, ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmationDialogContextType {
  showConfirmation: (options: ConfirmationOptions) => Promise<boolean>
}

interface ConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

const ConfirmationDialogContext = createContext<ConfirmationDialogContextType | undefined>(undefined)

export function useConfirmation() {
  const context = useContext(ConfirmationDialogContext)
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider')
  }
  return context
}

interface ConfirmationProviderProps {
  children: ReactNode
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: '',
    description: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'default'
  })
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null)

  const showConfirmation = (confirmationOptions: ConfirmationOptions): Promise<boolean> => {
    return new Promise((res) => {
      setOptions(confirmationOptions)
      setResolve(() => res)
      setIsOpen(true)
    })
  }

  const handleConfirm = () => {
    setIsOpen(false)
    if (resolve) {
      resolve(true)
      setResolve(null)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    if (resolve) {
      resolve(false)
      setResolve(null)
    }
  }

  return (
    <ConfirmationDialogContext.Provider value={{ showConfirmation }}>
      {children}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {options.variant === 'destructive' && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <DialogTitle className="text-left">{options.title}</DialogTitle>
                <DialogDescription className="text-left mt-1">
                  {options.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              {options.cancelText}
            </Button>
            <Button
              variant={options.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              className="w-full sm:w-auto"
            >
              {options.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmationDialogContext.Provider>
  )
}

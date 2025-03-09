'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline' 
import { useRouter } from 'next/navigation' 
import { Button } from "@/components/ui/button" 
import { useEffect, useState } from 'react' 

export default function PageNavigation() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed inset-y-0 left-4 right-4 z-10 pointer-events-none">
      <div className="h-full flex items-center justify-between">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="icon"
          className="pointer-events-auto"
          aria-label="Page précédente"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </Button>
        <Button
          onClick={() => router.forward()}
          variant="ghost"
          size="icon"
          className="pointer-events-auto"
          aria-label="Page suivante"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
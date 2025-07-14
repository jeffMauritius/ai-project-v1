'use client'

import Link from 'next/link'
import { Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline' 
import ThemeToggle from './ThemeToggle' 
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline' 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" 
import { useEffect, useState } from 'react'
import { signOut, useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [storefrontId, setStorefrontId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Récupère l'id de la vitrine si PARTNER
    const fetchStorefront = async () => {
      if (session?.user?.role === 'PARTNER') {
        try {
          const res = await fetch('/api/partner-storefront')
          if (res.ok) {
            const data = await res.json()
            setStorefrontId(data.id)
          }
        } catch (e) {
          // ignore
        }
      }
    }
    fetchStorefront()
  }, [session])

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/auth/login'
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      router.push('/auth/login');
    }
  };

  if (!mounted) {
    return null
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <span className="text-2xl font-semibold text-pink-600 dark:text-pink-400">MonMariage.ai</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {session?.user?.role === "PARTNER" && storefrontId && (
              <Link
                href={`/storefront/${storefrontId}`}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Voir ma vitrine publique"
              >
                <BuildingStorefrontIcon className="h-5 w-5" />
              </Link>
            )}
            <ThemeToggle />
            {status === "loading" ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="relative h-8 w-8 rounded-full">
                    <Avatar>
                      <AvatarImage src={session.user?.image || "https://github.com/shadcn.png"} />
                      <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center">
                      <Cog6ToothIcon className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center cursor-pointer">
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link 
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
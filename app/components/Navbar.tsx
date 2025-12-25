'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Cog6ToothIcon, ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline'
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

interface NavbarProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export default function Navbar({ onMenuClick, showMenuButton = false }: NavbarProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [storefrontId, setStorefrontId] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-30" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center space-x-4 md:space-x-8">
            {/* Bouton hamburger pour sidebar dashboard */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                aria-label="Ouvrir le menu"
              >
                <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>
            )}

            <Link href="/" className="flex flex-shrink-0 items-center">
              <Image src="/monmariage-logo.png" alt="MonMariage.ai logo" height={40} width={180} className="h-8 sm:h-10 w-auto" priority />
            </Link>

            {/* Navigation desktop */}
            <div className="hidden md:flex space-x-6">
              <Link
                href="/establishments"
                className="text-gray-700 dark:text-gray-300 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Lieux de mariages
              </Link>
              <Link
                href="/prestataires"
                className="text-gray-700 dark:text-gray-300 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Prestataires
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {session?.user?.role === "PARTNER" && storefrontId && (
              <Link
                href={`/storefront/${storefrontId}`}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Voir ma vitrine publique"
                title={`Voir ma vitrine`}
              >
                <BuildingStorefrontIcon className="h-5 w-5" />
              </Link>
            )}

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
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Liens navigation mobile */}
                  <div className="md:hidden">
                    <DropdownMenuItem asChild>
                      <Link href="/establishments" className="flex items-center">
                        Lieux de mariages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/prestataires" className="flex items-center">
                        Prestataires
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>

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
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
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

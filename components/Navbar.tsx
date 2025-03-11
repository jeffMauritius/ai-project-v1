'use client'

import Link from 'next/link'
import { Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import ThemeToggle from '@/app/components/ThemeToggle'
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <span className="text-2xl font-semibold text-pink-600 dark:text-pink-400">MonMariage.ai</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <p>Loading...</p>
            ) : session ? (
              <>
                <Link
                  href="/partner-dashboard"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Tableau de bord partenaire"
                >
                  <BuildingStorefrontIcon className="h-5 w-5" />
                </Link>
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-8 w-8 rounded-full">
                      <Avatar>
                        <AvatarImage src={session.user.image || "https://github.com/shadcn.png"} />
                        <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center">
                        <Cog6ToothIcon className="mr-2 h-4 w-4" />
                        <span>Paramètres</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <button onClick={() => signOut()} className="flex items-center">
                        <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                        <span>Déconnexion</span>
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Connexion"
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
'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (session?.user?.role) {
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      if (callbackUrl.startsWith('/')) {
        router.push(callbackUrl)
      } else {
        switch (session.user.role) {
          case "PARTNER":
            router.push('/partner-dashboard')
            break
          case "ADMIN":
            router.push('/admin/dashboard')
            break
          default:
            router.push('/dashboard/planning')
        }
      }
    }
  }, [session, router, searchParams])

  if (!mounted) {
    return null
  }
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const callbackUrl = searchParams.get('callbackUrl') || '/'
    
    try {
      const result = await signIn('credentials', {
        email: email,
        password: password,
        redirect: false,
        callbackUrl: callbackUrl
      });

      if (result?.error) {
        setError(result.error)
      }
    } catch (error) {
      setError('Une erreur est survenue lors de la connexion')
      console.error('Erreur de connexion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ou{' '}
            <Link href="/auth/register" className="font-medium text-pink-600 hover:text-pink-500">
              créez un compte gratuitement
            </Link>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Adresse email
            </Label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="pl-10"
                placeholder="vous@exemple.fr"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
              Mot de passe
            </Label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox
                id="remember-me"
                name="remember-me"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-pink-600 hover:text-pink-500">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
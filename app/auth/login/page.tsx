'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { loginSchema, type LoginFormData } from '@/lib/validation-schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

export default function Login() {
  const router = useRouter()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  const rememberMe = watch('remember')

  useEffect(() => {
    if (session?.user) {
      const callbackUrl = searchParams.get('callbackUrl') || 
        (session.user.role === 'PARTNER' ? '/partner-dashboard/settings' : '/dashboard/settings')
      router.push(callbackUrl)
    }
  }, [session, router, searchParams])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Email ou mot de passe incorrect",
        })
      } else if (result?.ok) {
        // La redirection sera gérée par le useEffect qui détecte le changement de session
        // Le callback sera déterminé en fonction du rôle de l'utilisateur
      }
    } catch (error) {
      setError('Une erreur est survenue')
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="email">Adresse email</Label>
            <div className="mt-1">
              <Input
                id="email"
                type="text"
                autoComplete="email"
                className={`block w-full ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <div className="mt-1">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`block w-full ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setValue('remember', checked as boolean)}
              />
              <Label htmlFor="remember" className="ml-2">
                Se souvenir de moi
              </Label>
            </div>

            <div className="text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-pink-600 hover:text-pink-500"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Pas encore de compte ?{' '}
          <Link
            href="/auth/register"
            className="font-medium text-pink-600 hover:text-pink-500"
          >
            Créez un compte gratuitement
          </Link>
        </p>
      </div>
    </div>
  )
}
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth/next'
import { Role } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    role: Role
  }
  interface Session {
    user: User & {
      id: string
      role: Role
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email et mot de passe requis')
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (!user || !user.password) {
            throw new Error('Email ou mot de passe incorrect')
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            throw new Error('Email ou mot de passe incorrect')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as Role,
          }
        } catch (error) {
          console.error('Erreur d\'authentification:', error)
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Si l'URL est relative ou commence par la baseUrl, on la garde
      if (url.startsWith(baseUrl) || url.startsWith('/')) {
        return url
      }

      // Sinon, on redirige vers le dashboard approprié
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return `${baseUrl}/auth/login`
      }

      switch (session.user.role) {
        case 'PARTNER':
          return `${baseUrl}/partner-dashboard`
        case 'ADMIN':
          return `${baseUrl}/admin/dashboard`
        default:
          return `${baseUrl}/dashboard`
      }
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
}
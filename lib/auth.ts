import { NextAuthOptions, DefaultUser, User } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as argon2 from 'argon2'
import { getServerSession } from 'next-auth/next'

declare module 'next-auth' {
  interface User extends DefaultUser {
    role: "USER" | "ADMIN" | "PARTNER"
  }
  interface Session {
    user: User & {
      id: string
      role: "USER" | "ADMIN" | "PARTNER"
    }
  }
}

export type UserRole = "USER" | "ADMIN" | "PARTNER"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
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
      async authorize(credentials): Promise<User | null> {
        console.log("[AUTH] Tentative de connexion avec:", { email: credentials?.email });

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Email ou mot de passe manquant");
          throw new Error('Email et mot de passe requis')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        console.log("[AUTH] Utilisateur trouvé:", user ? { ...user, password: '[HIDDEN]' } : 'null');

        if (!user || !user.password) {
          console.log("[AUTH] Utilisateur non trouvé ou pas de mot de passe");
          throw new Error('Email ou mot de passe incorrect')
        }

        try {
          console.log("[AUTH] Vérification du mot de passe");
          const isPasswordValid = await argon2.verify(user.password, credentials.password)
          console.log("[AUTH] Résultat de la vérification:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("[AUTH] Mot de passe invalide");
            throw new Error('Email ou mot de passe incorrect')
          }

          if (!["USER", "ADMIN", "PARTNER"].includes(user.role)) {
            console.log("[AUTH] Rôle invalide:", user.role);
            throw new Error('Rôle utilisateur invalide')
          }

          console.log("[AUTH] Connexion réussie pour:", user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            image: user.image
          }
        } catch (error) {
          console.error("[AUTH] Erreur lors de la vérification:", error);
          throw new Error('Erreur lors de la vérification du mot de passe')
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
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
          return `${baseUrl}/partner-dashboard/settings`
        case 'ADMIN':
          return `${baseUrl}/admin/dashboard`
        default:
          return `${baseUrl}/dashboard/settings`
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
import { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth/next";
import { Role } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          throw new Error("Email ou mot de passe incorrect");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Email ou mot de passe incorrect");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
    async redirect({ url, baseUrl }) {
      if (url.includes('/auth/login')) {
        return url;
      }

      if (url.startsWith("/")) {
        const token = await getToken({ 
          req: new NextRequest(url, { 
            headers: new Headers(),
            method: 'GET',
            body: null,
            cache: 'no-store',
            credentials: 'include',
            integrity: '',
            keepalive: false,
            mode: 'cors',
            redirect: 'follow',
            referrer: '',
            referrerPolicy: '',
            signal: null,
            url: url
          })
        });
        
        if (token?.role === "PARTNER") {
          return `${baseUrl}/partner-dashboard`;
        } else if (token?.role === "ADMIN") {
          return `${baseUrl}/admin/dashboard`;
        } else {
          return `${baseUrl}/dashboard/planning`;
        }
      }
      return url;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
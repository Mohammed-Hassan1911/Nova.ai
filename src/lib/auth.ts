import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit, ipKey } from '@/lib/rate-limit'
import { envInt } from '@/lib/env'

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        // Explicit: secure in production. Auth.js also derives this from the
        // request protocol (and prefixes the cookie with __Secure-), but we
        // pin it here so the intent is visible in config.
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
  providers: [
    Credentials({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        // Brute-force / CPU-cost protection: fail fast before the bcrypt
        // compare once the per-IP budget is exhausted.
        const rl = rateLimit({
          key: ipKey(request, 'login'),
          limit: envInt('LOGIN_RATE_LIMIT_ATTEMPTS', 10),
          windowMs: envInt('LOGIN_RATE_LIMIT_WINDOW_MS', 60_000),
        })
        if (rl.limited) return null

        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
        if (!user?.passwordHash) return null
        const valid = await compare(password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        // Fresh sign-in: stamp the current tokenVersion onto the JWT.
        token.id = user.id
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { tokenVersion: true },
        })
        token.tokenVersion = dbUser?.tokenVersion ?? 0
        return token
      }

      // Subsequent requests: invalidate any JWT minted before a password
      // change (tokenVersion is bumped on reset), revoking old sessions.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { tokenVersion: true },
        })
        if (!dbUser || dbUser.tokenVersion !== ((token.tokenVersion as number | undefined) ?? 0)) {
          return null
        }
      }
      return token
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string
      return session
    },
  },
})

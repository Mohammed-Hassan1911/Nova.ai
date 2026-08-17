import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma, prismaQuery } from '@/lib/prisma'
import { rateLimit, ipKey } from '@/lib/rate-limit'
import { envInt } from '@/lib/env'
import { TTLCache } from '@/lib/cache'

const TOKEN_VERSION_CACHE_TTL_MS = envInt('TOKEN_VERSION_CACHE_TTL_MS', 30_000)
const tokenVersionCache = new TTLCache<number>(TOKEN_VERSION_CACHE_TTL_MS)

export function invalidateTokenVersionCache(userId: string) {
  tokenVersionCache.delete(userId)
}

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Run a Prisma query with a timeout. If the query takes longer than
 * `ms` milliseconds, return `fallback` instead of hanging forever.
 * This prevents connection pool exhaustion from blocking signIn.
 */
function withTimeout<T>(query: () => Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    query(),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

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
        secure: (process.env.AUTH_URL ?? '').startsWith('https://'),
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
  providers: [
    Credentials({
      name: 'Email and password',
      credentials: {
        identifier: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        console.log('[auth] authorize called')
        // Brute-force / CPU-cost protection: fail fast before the bcrypt
        // compare once the per-IP budget is exhausted.
        const rl = await rateLimit({
          key: ipKey(request, 'login'),
          limit: envInt('LOGIN_RATE_LIMIT_ATTEMPTS', 10),
          windowMs: envInt('LOGIN_RATE_LIMIT_WINDOW_MS', 60_000),
        })
        if (rl.limited) {
          console.log('[auth] authorize: rate limited')
          return null
        }

        const rawIdentifier = credentials?.identifier as string | undefined
        const password = credentials?.password as string | undefined
        if (!rawIdentifier || !password) {
          console.log('[auth] authorize: missing credentials')
          return null
        }

        const identifier = rawIdentifier.trim().toLowerCase()
        console.log('[auth] authorize: looking up user by email')

        const user = await withTimeout(
          () => prismaQuery(() =>
            prisma.user.findUnique({
              where: { email: identifier },
            }),
          ),
          10_000,
          null,
        )
        console.log('[auth] authorize: user found:', !!user, 'hasPassword:', !!user?.passwordHash)
        if (!user?.passwordHash) return null
        const valid = await compare(password, user.passwordHash)
        console.log('[auth] authorize: password valid:', valid)
        if (!valid) return null

        console.log('[auth] authorize: returning user')
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
        console.log('[auth] jwt: fresh sign-in, user.id:', user.id)
        // Fresh sign-in: stamp the current tokenVersion onto the JWT.
        token.id = user.id
        try {
          const dbUser = await withTimeout(
            () => prisma.user.findUnique({
              where: { id: user.id },
              select: { tokenVersion: true },
            }),
            5_000,
            null,
          )
          token.tokenVersion = dbUser?.tokenVersion ?? 0
          console.log('[auth] jwt: tokenVersion stamped:', token.tokenVersion)
        } catch (e) {
          console.log('[auth] jwt: tokenVersion lookup failed:', e)
          token.tokenVersion = 0
        }
        return token
      }

      // Subsequent requests: invalidate any JWT minted before a password
      // change (tokenVersion is bumped on reset), revoking old sessions.
      if (token.id) {
        const userId = token.id as string
        let currentVersion = tokenVersionCache.get(userId)
        if (currentVersion === undefined) {
          try {
            const dbUser = await withTimeout(
              () => prisma.user.findUnique({
                where: { id: userId },
                select: { tokenVersion: true },
              }),
              5_000,
              null,
            )
            currentVersion = dbUser?.tokenVersion ?? 0
            tokenVersionCache.set(userId, currentVersion)
          } catch {
            currentVersion = (token.tokenVersion as number | undefined) ?? 0
          }
        }
        if (currentVersion !== ((token.tokenVersion as number | undefined) ?? 0)) {
          console.log('[auth] jwt: tokenVersion mismatch, invalidating session')
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

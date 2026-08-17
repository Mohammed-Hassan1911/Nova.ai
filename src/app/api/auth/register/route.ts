import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { prisma, prismaQuery } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { registerSchema } from '@/lib/validation/schemas'
import { rateLimit, ipKey } from '@/lib/rate-limit'

/**
 * Register endpoint — creates the User directly and returns success.
 * The client signs in with credentials immediately after.
 */
export const POST = api(async (req: Request) => {
  const rl = await rateLimit({ key: ipKey(req, 'register'), limit: 10, windowMs: 60_000 })
  if (rl.limited) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in a minute.' },
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  const body = await parseBody(req, registerSchema)

  const existing = await prismaQuery(() =>
    prisma.user.findUnique({ where: { email: body.email! } }),
  )
  if (existing) {
    throw new ApiError('EMAIL_TAKEN', 'An account with this email already exists. Try signing in instead.', 409)
  }

  const passwordHash = await hash(body.password, 12)

  const user = await prismaQuery(() =>
    prisma.user.create({
      data: {
        name: body.name!.trim(),
        email: body.email!,
        passwordHash,
        emailVerified: new Date(),
      },
      select: { id: true, email: true },
    }),
  )

  return ok(
    { userId: user.id, email: user.email },
    { status: 201 },
  )
})

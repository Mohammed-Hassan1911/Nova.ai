import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { resetPasswordSchema } from '@/lib/validation/schemas'
import { rateLimit, ipKey } from '@/lib/rate-limit'

export const POST = api(async (req: Request) => {
  const rl = rateLimit({ key: ipKey(req, 'reset'), limit: 10, windowMs: 60_000 })
  if (rl.limited) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in a minute.' },
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  const { token, password } = await parseBody(req, resetPasswordSchema)

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record || record.expires < new Date()) {
    throw new ApiError('INVALID_TOKEN', 'This reset link is invalid or has expired.', 400)
  }

  const passwordHash = await hash(password, 12)
  await prisma.$transaction([
    // Bumping tokenVersion invalidates every JWT minted before this change.
    prisma.user.update({
      where: { id: record.identifier },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ])

  return ok({ reset: true })
})

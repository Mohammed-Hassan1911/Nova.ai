import { compare } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { prisma, prismaQuery } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { loginSchema } from '@/lib/validation/schemas'
import { rateLimit, ipKey } from '@/lib/rate-limit'
import { envInt } from '@/lib/env'
import {
  generateCode,
  hashCode,
  CODE_EXPIRY_MS,
  MAX_ATTEMPTS,
} from '@/server/services/verification/code'
import { sendEmailVerification } from '@/server/services/verification/email'

/**
 * Login endpoint that validates credentials and returns verification
 * status. The actual session is created via NextAuth signIn() on the
 * client after this check passes.
 *
 * When the user is unverified, a VerificationCode is created and the
 * VerificationCode ID is returned (not the User ID). This ensures the
 * verify flow is consistent with pending signups.
 */
export const POST = api(async (req: Request) => {
  // Rate limit
  const rl = await rateLimit({
    key: ipKey(req, 'login-check'),
    limit: envInt('LOGIN_RATE_LIMIT_ATTEMPTS', 10),
    windowMs: envInt('LOGIN_RATE_LIMIT_WINDOW_MS', 60_000),
  })
  if (rl.limited) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: `Too many attempts. Please try again in ${rl.retryAfterSeconds}s.` },
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  const body = await parseBody(req, loginSchema)

  const normalizedEmail = body.identifier.toLowerCase()

  // Look up user by email
  const user = await prismaQuery(() =>
    prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, passwordHash: true, emailVerified: true },
    }),
  )

  // Generic error — never reveal whether user exists
  if (!user || !user.passwordHash) {
    throw new ApiError('INVALID_CREDENTIALS', 'Invalid email or password.', 401)
  }

  // Verify password
  const valid = await compare(body.password, user.passwordHash)
  if (!valid) {
    throw new ApiError('INVALID_CREDENTIALS', 'Invalid email or password.', 401)
  }

  // Check verification status
  const verified = !!user.emailVerified

  if (!verified) {
    const destination = user.email

    // Invalidate old unused verification codes for this user
    await prismaQuery(() =>
      prisma.verificationCode.updateMany({
        where: { userId: user.id, type: 'EMAIL', used: false },
        data: { used: true },
      }),
    )

    // Generate and send a new verification code
    const code = generateCode()
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS)

    const codeRecord = await prismaQuery(() =>
      prisma.verificationCode.create({
        data: {
          userId: user.id,
          type: 'EMAIL',
          destination,
          codeHash,
          expiresAt,
          maxAttempts: MAX_ATTEMPTS,
        },
        select: { id: true },
      }),
    )

    // Attempt delivery
    const result = await sendEmailVerification({ to: destination, code })
    if (!result.sent) {
      throw new ApiError(
        'DELIVERY_FAILED',
        'Could not send the verification code. Please try again.',
        502,
      )
    }

    // Return the VerificationCode ID (not User ID) so the verify flow
    // is consistent with pending signups.
    return ok({
      verified: false,
      userId: codeRecord.id,
      method: 'EMAIL' as const,
      destination,
    })
  }

  return ok({
    verified: true,
    userId: user.id,
    email: user.email,
  })
})

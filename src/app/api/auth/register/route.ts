import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { prisma, prismaQuery } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { registerSchema } from '@/lib/validation/schemas'
import { rateLimit, ipKey } from '@/lib/rate-limit'
import {
  generateCode,
  hashCode,
  CODE_EXPIRY_MS,
  MAX_ATTEMPTS,
} from '@/server/services/verification/code'
import { sendEmailVerification } from '@/server/services/verification/email'

/**
 * Register endpoint.
 *
 * Architecture: NO User is created during registration. Signup data is
 * stored on a VerificationCode record (pending signup). The User is
 * created ONLY after successful OTP verification. This prevents orphan
 * User records when email delivery fails.
 *
 * Flow:
 *   1. Validate input
 *   2. Check for existing user with same email → block
 *   3. Check for existing PENDING verification → resend OTP
 *   4. Generate OTP, attempt email delivery
 *   5. If delivery fails → clean rollback, email available for retry
 *   6. If delivery succeeds → return verification state
 *   7. User enters OTP → verify → create User → login
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

  const destination = body.email!

  // ── 1. Check for existing user ──────────────────────────────

  const existing = await prismaQuery(() =>
    prisma.user.findUnique({ where: { email: body.email! } }),
  )
  if (existing) {
    throw new ApiError('EMAIL_TAKEN', 'An account with this email already exists. Try signing in instead.', 409)
  }

  // ── 2. Check for existing PENDING verification ───────────────

  // Clean up expired pending signups for this destination
  await prismaQuery(() =>
    prisma.verificationCode.deleteMany({
      where: {
        destination,
        type: 'EMAIL',
        pendingPasswordHash: { not: null },
        expiresAt: { lte: new Date() },
      },
    }),
  )

  const existingPending = await prismaQuery(() =>
    prisma.verificationCode.findFirst({
      where: {
        destination,
        type: 'EMAIL',
        used: false,
        expiresAt: { gt: new Date() },
        pendingPasswordHash: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userId: true },
    }),
  )

  if (existingPending) {
    // Resend OTP for the existing pending signup
    const code = generateCode()
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS)

    // Invalidate old code and store new one
    await prismaQuery(() =>
      prisma.verificationCode.update({
        where: { id: existingPending.id },
        data: {
          codeHash,
          expiresAt,
          attempts: 0,
          used: false,
        },
      }),
    )

    // Attempt delivery
    const result = await sendEmailVerification({ to: destination, code })
    if (!result.sent) {
      // Email failed — clean up so email is available for retry
      await prismaQuery(() =>
        prisma.verificationCode.delete({ where: { id: existingPending.id } }),
      )
      throw new ApiError(
        'DELIVERY_FAILED',
        'Could not send the verification code. Please try again.',
        502,
      )
    }

    return ok({
      requiresVerification: true,
      userId: existingPending.userId ?? 'pending',
      verificationType: 'EMAIL' as const,
      destination,
    })
  }

  // ── 3. New signup — generate OTP and attempt delivery ────────

  const passwordHash = await hash(body.password, 12)
  const code = generateCode()
  const codeHash = hashCode(code)
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS)

  // Attempt delivery FIRST (before creating any DB records)
  const result = await sendEmailVerification({ to: destination, code })
  if (!result.sent) {
    // Delivery failed — no DB records to clean up, email is available
    throw new ApiError(
      'DELIVERY_FAILED',
      'Could not send the verification code. Please try again.',
      502,
    )
  }

  // Delivery succeeded — now create the pending signup record
  // No User is created yet. The User will be created after OTP verification.
  const pending = await prismaQuery(() =>
    prisma.verificationCode.create({
      data: {
        type: 'EMAIL',
        destination,
        codeHash,
        expiresAt,
        maxAttempts: MAX_ATTEMPTS,
        pendingName: body.name.trim(),
        pendingPasswordHash: passwordHash,
        pendingMethod: 'EMAIL',
      },
      select: { id: true },
    }),
  )

  return ok(
    {
      requiresVerification: true,
      userId: pending.id,
      verificationType: 'EMAIL' as const,
      destination,
    },
    { status: 201 },
  )
})

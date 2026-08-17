import { NextResponse } from 'next/server'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { resendCodeSchema } from '@/lib/validation/schemas'
import { rateLimit, ipKey } from '@/lib/rate-limit'
import { prismaQuery, prisma } from '@/lib/prisma'
import {
  generateCode,
  hashCode,
  CODE_EXPIRY_MS,
  MAX_ATTEMPTS,
} from '@/server/services/verification/code'
import { sendEmailVerification } from '@/server/services/verification/email'

export const POST = api(async (req: Request) => {
  // Rate limit: 5 resend attempts per minute per IP
  const rl = await rateLimit({ key: ipKey(req, 'verify-resend'), limit: 5, windowMs: 60_000 })
  if (rl.limited) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.`,
        },
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  const body = await parseBody(req, resendCodeSchema)

  // body.userId is either a User ID (login verification) or a
  // VerificationCode ID (pending signup). Try both.
  const codeId = body.userId

  // ── 1. Check if it's a pending signup VerificationCode ──────

  const pendingCode = await prismaQuery(() =>
    prisma.verificationCode.findUnique({
      where: { id: codeId },
      select: {
        id: true,
        userId: true,
        type: true,
        destination: true,
        used: true,
        expiresAt: true,
        pendingPasswordHash: true,
      },
    }),
  )

  if (pendingCode && !pendingCode.userId && pendingCode.pendingPasswordHash) {
    // This is a pending signup — resend OTP

    const code = generateCode()
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS)

    // Invalidate old code, store new one
    await prismaQuery(() =>
      prisma.verificationCode.update({
        where: { id: pendingCode.id },
        data: { codeHash, expiresAt, attempts: 0, used: false },
      }),
    )

    // Attempt delivery
    const result = await sendEmailVerification({ to: pendingCode.destination, code })
    if (!result.sent) {
      // Clean up so email is available for retry
      await prismaQuery(() =>
        prisma.verificationCode.delete({ where: { id: pendingCode.id } }),
      )
      throw new ApiError('DELIVERY_FAILED', 'Could not send the verification code. Please try again.', 502)
    }

    return ok({ sent: true, destination: pendingCode.destination })
  }

  // ── 2. User-based verification (login flow) ────────────────

  const user = await prismaQuery(() =>
    prisma.user.findUnique({
      where: { id: codeId },
      select: { id: true, email: true, emailVerified: true },
    }),
  )

  if (!user) {
    // Don't reveal whether user exists
    return ok({ sent: true })
  }

  // Check if already verified
  if (user.emailVerified) {
    return ok({ sent: true })
  }

  const destination = user.email

  // Invalidate old codes for this user
  await prismaQuery(() =>
    prisma.verificationCode.updateMany({
      where: { userId: user.id, type: 'EMAIL', used: false },
      data: { used: true },
    }),
  )

  // Generate and store new code
  const code = generateCode()
  const codeHash = hashCode(code)
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS)

  await prismaQuery(() =>
    prisma.verificationCode.create({
      data: {
        userId: user.id,
        type: 'EMAIL',
        destination,
        codeHash,
        expiresAt,
        maxAttempts: MAX_ATTEMPTS,
      },
    }),
  )

  // Send
  const result = await sendEmailVerification({ to: destination, code })
  if (!result.sent) {
    throw new ApiError('DELIVERY_FAILED', 'We could not send the verification code. Please try again.', 502)
  }

  return ok({ sent: true, destination })
})

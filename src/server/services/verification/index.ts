/**
 * Verification code orchestration.
 *
 * Handles the full lifecycle: generate → hash → store → send → verify.
 * Codes are never stored as plaintext. Previous unused codes are
 * invalidated when a new one is generated for the same user+type.
 *
 * Two flows:
 *   1. Login verification: User exists, just verify email.
 *   2. Pending signup: No User yet. VerificationCode holds signup data.
 *      User is created ONLY after successful OTP verification.
 */
import { randomBytes } from 'crypto'
import { prisma, prismaQuery } from '@/lib/prisma'
import { generateCode, hashCode, verifyCode, CODE_EXPIRY_MS, MAX_ATTEMPTS } from './code'
import { sendEmailVerification } from './email'

export type VerificationType = 'EMAIL'

export interface SendVerificationOpts {
  userId: string
  type: VerificationType
  destination: string   // email address
}

export interface VerifyCodeOpts {
  /** The VerificationCode record ID (used for both flows). */
  verificationCodeId: string
  code: string
}

export interface VerificationResult {
  success: boolean
  error?: 'INVALID_CODE' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'DELIVERY_FAILED' | 'UNKNOWN'
  maskedDestination?: string
  /** The actual email used — only present on success. */
  actualDestination?: string
  /** When a pending signup is verified, the newly created User ID. */
  createdUserId?: string
}

export class DeliveryFailedError extends Error {
  constructor(public providerError?: string) {
    super('Verification code delivery failed.')
    this.name = 'DeliveryFailedError'
  }
}

/**
 * Generate a new verification code, invalidate any previous unused codes,
 * store the hash, and send via email.
 *
 * Used by the resend endpoint for existing signups (User already exists).
 */
export async function sendVerificationCode(opts: SendVerificationOpts): Promise<{ sent: boolean; maskedDestination: string }> {
  const { userId, type, destination } = opts

  // Invalidate all previous unused codes for this user+type
  await prismaQuery(() =>
    prisma.verificationCode.updateMany({
      where: { userId, type, used: false },
      data: { used: true },
    }),
  )

  // Generate and hash the code
  const code = generateCode()
  const codeHash = hashCode(code)
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS)

  // Store in database
  await prismaQuery(() =>
    prisma.verificationCode.create({
      data: {
        userId,
        type,
        destination,
        codeHash,
        expiresAt,
        maxAttempts: MAX_ATTEMPTS,
      },
    }),
  )

  // Send via email
  const result = await sendEmailVerification({ to: destination, code })

  if (!result.sent) {
    throw new DeliveryFailedError()
  }

  return { sent: true, maskedDestination: maskEmail(destination) }
}

/**
 * Verify a user-entered code against the most recent unused code.
 *
 * Handles both flows:
 *   - Login verification: VerificationCode has userId → mark email verified.
 *   - Pending signup: VerificationCode has pendingPasswordHash → create User, then verify.
 */
export async function verifyCodeEntry(opts: VerifyCodeOpts): Promise<VerificationResult> {
  const { verificationCodeId, code } = opts

  // Find the specific VerificationCode record by ID
  const record = await prismaQuery(() =>
    prisma.verificationCode.findUnique({
      where: { id: verificationCodeId },
    }),
  )

  if (!record) {
    return { success: false, error: 'INVALID_CODE' }
  }

  // Check if already used
  if (record.used) {
    return { success: false, error: 'INVALID_CODE' }
  }

  // Check if expired
  if (record.expiresAt <= new Date()) {
    return { success: false, error: 'EXPIRED' }
  }

  // Check attempts
  if (record.attempts >= record.maxAttempts) {
    return { success: false, error: 'TOO_MANY_ATTEMPTS' }
  }

  // Increment attempts
  await prismaQuery(() =>
    prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    }),
  )

  // Verify the code
  if (!verifyCode(code, record.codeHash)) {
    return { success: false, error: 'INVALID_CODE' }
  }

  // Code is correct — handle pending signup vs login verification
  const isPendingSignup = !!record.pendingPasswordHash

  if (isPendingSignup) {
    // ── Pending signup: create the User, then verify ──────────

    const newUser = await prismaQuery(() =>
      prisma.$transaction(async (tx) => {
        // Create the User
        const user = await tx.user.create({
          data: {
            name: record.pendingName ?? 'User',
            email: record.destination,
            passwordHash: record.pendingPasswordHash!,
          },
          select: { id: true },
        })

        // Mark email as verified
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        })

        // Mark the VerificationCode as used and link it to the new user
        await tx.verificationCode.update({
          where: { id: record.id },
          data: {
            used: true,
            userId: user.id,
          },
        })

        return user
      }),
    )

    return {
      success: true,
      maskedDestination: maskEmail(record.destination),
      actualDestination: record.destination,
      createdUserId: newUser.id,
    }
  }

  // ── Login verification: just mark as verified ──────────────

  await prismaQuery(() =>
    prisma.$transaction([
      prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: record.userId! },
        data: { emailVerified: new Date() },
      }),
    ]),
  )

  return {
    success: true,
    maskedDestination: maskEmail(record.destination),
    actualDestination: record.destination,
  }
}

/** Mask an email for display: u***@gmail.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  if (local.length <= 1) return `${local}@${domain}`
  return `${local[0]}${'*'.repeat(Math.max(0, local.length - 1))}@${domain}`
}

export { maskEmail }

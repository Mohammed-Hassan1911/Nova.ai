import { NextResponse } from 'next/server'
import { parseBody } from '@/lib/api'
import { verifyCodeSchema } from '@/lib/validation/schemas'
import { rateLimit, ipKey } from '@/lib/rate-limit'
import { verifyCodeEntry } from '@/server/services/verification'

const errorResponse = (code: string, message: string, status: number) =>
  NextResponse.json({ success: false, error: { code, message } }, { status })

export async function POST(req: Request) {
  try {
    const rl = await rateLimit({ key: ipKey(req, 'verify'), limit: 10, windowMs: 60_000 })
    if (rl.limited) {
      return errorResponse('RATE_LIMITED', `Too many attempts. Please try again in ${rl.retryAfterSeconds}s.`, 429)
    }

    const body = await parseBody(req, verifyCodeSchema)

    const result = await verifyCodeEntry({
      verificationCodeId: body.userId,
      code: body.code,
    })

    if (!result.success) {
      switch (result.error) {
        case 'INVALID_CODE':
          return errorResponse('INVALID_CODE', 'That code is not correct. Please try again.', 400)
        case 'EXPIRED':
          return errorResponse('CODE_EXPIRED', 'That code has expired. Request a new one.', 400)
        case 'TOO_MANY_ATTEMPTS':
          return errorResponse('TOO_MANY_ATTEMPTS', 'Too many attempts. Please request a new code.', 429)
        default:
          return errorResponse('VERIFY_FAILED', 'Verification failed. Please try again.', 400)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        destination: result.maskedDestination,
        actualDestination: result.actualDestination,
        createdUserId: result.createdUserId,
      },
    })
  } catch (err) {
    console.error('[verify] unexpected error:', err)
    return errorResponse('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500)
  }
}

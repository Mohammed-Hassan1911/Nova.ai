import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { forgotPasswordSchema } from '@/lib/validation/schemas'
import { rateLimit, ipKey } from '@/lib/rate-limit'
import { sendEmail, emailShell } from '@/server/services/email'

export const POST = api(async (req: Request) => {
  const rl = await rateLimit({ key: ipKey(req, 'forgot'), limit: 5, windowMs: 60_000 })
  if (rl.limited) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in a minute.' },
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  const { email } = await parseBody(req, forgotPasswordSchema)

  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    const token = randomBytes(32).toString('base64url')
    await prisma.verificationToken.create({
      data: {
        identifier: user.id,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`
    await sendEmail({
      to: email,
      subject: 'Reset your VANTA password',
      html: emailShell({
        title: 'Reset your password',
        body: `
          <h1 style="font-size:18px;margin:0 0 12px;color:#f4f3ef;">Reset your VANTA password</h1>
          <p style="font-size:14px;line-height:1.7;color:#a6a6b0;margin:0 0 20px;">
            We received a request to reset your password. The link below expires in one hour.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#c8a96b;color:#0b0b0e;font-weight:600;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">
            Reset password
          </a>
          <p style="font-size:12px;color:#686872;margin-top:20px;">
            If you didn't request this, you can safely ignore this email.
          </p>`,
      }),
    })
  }

  // Always report success to avoid leaking whether an email exists.
  return ok({ sent: true })
})

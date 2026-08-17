/**
 * Email verification sender.
 *
 * Uses the existing Resend-based email service. Falls back gracefully
 * when RESEND_API_KEY is not configured (logs and no-ops).
 */
import { sendEmail, emailShell } from '@/server/services/email'

export interface SendEmailVerificationOpts {
  to: string
  code: string
  appName?: string
}

export async function sendEmailVerification(opts: SendEmailVerificationOpts): Promise<{ sent: boolean }> {
  const { to, code, appName = 'VANTA' } = opts

  const digits = code.split('')

  const html = emailShell({
    title: 'Verify your email',
    body: `
      <h1 style="font-size:18px;margin:0 0 12px;color:#f4f3ef;">Verify your email</h1>
      <p style="font-size:14px;line-height:1.7;color:#a6a6b0;margin:0 0 24px;">
        Enter the 6-digit code below to verify your ${appName} account.
        This code expires in 10 minutes.
      </p>
      <div style="display:flex;gap:8px;justify-content:center;margin:0 0 24px;">
        ${digits.map((d) => `
          <div style="width:48px;height:56px;display:flex;align-items:center;justify-content:center;background:#1c1c24;border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-size:24px;font-weight:700;color:#f4f3ef;letter-spacing:0;">
            ${d}
          </div>
        `).join('')}
      </div>
      <p style="font-size:13px;color:#686872;margin:0;">
        If you did not create an account, you can safely ignore this email.
      </p>`,
  })

  const result = await sendEmail({
    to,
    subject: `Your ${appName} verification code: ${code}`,
    html,
  })

  return { sent: !result.skipped }
}

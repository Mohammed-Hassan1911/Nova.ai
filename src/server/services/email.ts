import { Resend } from 'resend'

/**
 * Transactional email service.
 *
 * Emails are never sent from client-side code — only server services call
 * sendEmail. When RESEND_API_KEY is unset the service logs and no-ops,
 * which keeps local development working without an account.
 */

export interface EmailPayload {
  to: string
  subject: string
  html: string
  replyTo?: string
}

const apiKey = process.env.RESEND_API_KEY
const from = process.env.EMAIL_FROM || 'VANTA <onboarding@resend.dev>'
const resend = apiKey ? new Resend(apiKey) : null

export async function sendEmail(payload: EmailPayload): Promise<{ id?: string; skipped: boolean }> {
  if (!resend) {
    console.info('[email] RESEND_API_KEY not configured — email skipped:', payload.subject)
    return { skipped: true }
  }
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      replyTo: payload.replyTo,
    })
    if (error) {
      console.error('[email] send failed:', error)
      return { skipped: true }
    }
    return { id: data?.id, skipped: false }
  } catch (e) {
    console.error('[email] send threw:', e)
    return { skipped: true }
  }
}

/** Shared brand shell for HTML emails. */
export function emailShell({ title, body }: { title: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0e;color:#f4f3ef;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="font-size:16px;font-weight:700;letter-spacing:4px;color:#8b5cf6;">VANTA</div>
      <div style="margin-top:24px;background:#141419;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:28px;">
        ${body}
      </div>
      <p style="margin-top:24px;color:#686872;font-size:12px;line-height:1.6;">
        VANTA · AI business operating system<br/>
        You received this because you use VANTA. If this wasn't you, you can safely ignore it.
      </p>
    </div>
  </body>
</html>`
}

import { NextResponse } from 'next/server'
import { sweepOverdueInvoices } from '@/server/services/notifications'

/**
 * Scheduled job trigger for the overdue-invoice sweep.
 *
 * Protected by CRON_SECRET (bearer token). When the secret is unset the
 * endpoint is disabled so it can never be used to trigger writes.
 *
 * Scheduled via vercel.json crons. For non-Vercel deployments wire this
 * to any scheduler (systemd timer, cron, GitHub Actions, etc.).
 */
export const POST = async (req: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ success: false, error: 'CRON_SECRET not configured.' }, { status: 404 })
  }

  const auth = req.headers.get('authorization')
  const expected = `Bearer ${secret}`
  const vercelCronHeader = req.headers.get('x-vercel-cron')

  // The platform cron header is trusted; the bearer token is the shared fallback.
  if (auth !== expected && vercelCronHeader !== '1') {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
  }

  const swept = await sweepOverdueInvoices()
  return NextResponse.json({ success: true, data: { swept } })
}

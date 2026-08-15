import { prisma } from '@/lib/prisma'
import { envInt } from '@/lib/env'
import type { NotificationKind, Prisma } from '@prisma/client'

export async function createNotification(
  input: {
    workspaceId: string
    kind: NotificationKind
    title: string
    detail?: string | null
    link?: string | null
  },
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const db = tx ?? prisma
  await db.notification.create({ data: input })
}

export async function unreadNotificationCount(workspaceId: string): Promise<number> {
  return prisma.notification.count({ where: { workspaceId, readAt: null } })
}

export async function markNotificationsRead(workspaceId: string, ids: string[]): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { id: { in: ids }, workspaceId, readAt: null },
    data: { readAt: new Date() },
  })
  return result.count
}

export async function markAllNotificationsRead(workspaceId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { workspaceId, readAt: null },
    data: { readAt: new Date() },
  })
  return result.count
}

/**
 * Marks PENDING invoices that have passed their due date as OVERDUE.
 * Sends a notification for each newly-overdue invoice. Called from a
 * scheduled/cron handler and before reading invoice lists.
 */
export async function sweepOverdueInvoices(): Promise<number> {
  const now = new Date()
  const overdue = await prisma.invoice.findMany({
    where: { status: 'PENDING', dueDate: { lt: now } },
    include: { client: { select: { company: true } }, workspace: { select: { id: true } } },
  })
  if (overdue.length === 0) return 0

  await prisma.$transaction(async (tx) => {
    for (const invoice of overdue) {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE', overdueNotifiedAt: now },
      })
      await tx.notification.create({
        data: {
          workspaceId: invoice.workspaceId,
          kind: 'INVOICE_OVERDUE',
          title: `Invoice ${invoice.number} is overdue`,
          detail: `${invoice.client.company} · due ${invoice.dueDate.toLocaleDateString()}`,
          link: `/invoices/${invoice.id}`,
        },
      })
      await tx.activity.create({
        data: {
          workspaceId: invoice.workspaceId,
          kind: 'INVOICE_OVERDUE',
          text: `Invoice ${invoice.number} marked as overdue`,
          detail: invoice.client.company,
          invoiceId: invoice.id,
        },
      })
    }
  })
  return overdue.length
}

/**
 * Minimum time between two automatic overdue sweeps (per process).
 *
 * The sweep is a write-heavy job; this gate keeps it off the per-request
 * hot path. The real trigger is the cron endpoint (`/api/cron/overdue`,
 * see vercel.json); this lazy gate is a resilience fallback so behaviour is
 * preserved on single-instance/dev deployments without a cron scheduler.
 */
const OVERDUE_SWEEP_INTERVAL_MS = envInt('OVERDUE_SWEEP_INTERVAL_MS', 300_000)

let lastSweepAt = 0
let sweepInFlight: Promise<number> | null = null

/** Runs the overdue sweep at most once per OVERDUE_SWEEP_INTERVAL_MS. */
export async function sweepIfDue(): Promise<number> {
  const now = Date.now()
  if (now - lastSweepAt < OVERDUE_SWEEP_INTERVAL_MS) return 0
  lastSweepAt = now
  if (!sweepInFlight) {
    sweepInFlight = sweepOverdueInvoices().finally(() => {
      sweepInFlight = null
    })
  }
  return sweepInFlight
}

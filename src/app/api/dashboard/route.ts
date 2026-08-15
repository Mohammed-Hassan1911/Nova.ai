import { prisma } from '@/lib/prisma'
import { api, ok } from '@/lib/api'
import { requireWorkspaceContext } from '@/lib/workspace'
import { computeInvoiceTotals, itemsToLines } from '@/server/services/invoices'
import { sweepOverdueInvoices } from '@/server/services/notifications'

const pad = (n: number) => String(n).padStart(2, '0')

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

export const GET = api(async () => {
  const { workspace } = await requireWorkspaceContext()
  await sweepOverdueInvoices()

  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const twelveMonthsAgo = new Date(startOfMonth)
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11)

  const [
    clientCount,
    projectCount,
    openTaskCount,
    completedTaskCount,
    invoices,
    payments,
    recentActivity,
    overdueInvoices,
  ] = await Promise.all([
    prisma.client.count({ where: { workspaceId: workspace.id } }),
    prisma.project.count({ where: { workspaceId: workspace.id } }),
    prisma.task.count({ where: { workspaceId: workspace.id, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
    prisma.task.count({ where: { workspaceId: workspace.id, status: 'COMPLETED' } }),
    prisma.invoice.findMany({
      where: { workspaceId: workspace.id, status: { in: ['PENDING', 'OVERDUE', 'PAID'] } },
      include: { items: true },
    }),
    prisma.payment.findMany({
      where: { workspaceId: workspace.id, paidAt: { gte: twelveMonthsAgo } },
      select: { amount: true, paidAt: true },
    }),
    prisma.activity.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.invoice.findMany({
      where: { workspaceId: workspace.id, status: 'OVERDUE' },
      include: { client: { select: { company: true } }, items: true },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
  ])

  let outstanding = 0
  let overdue = 0
  const statusBreakdown: Record<string, number> = { DRAFT: 0, PENDING: 0, PAID: 0, OVERDUE: 0, CANCELLED: 0 }

  for (const inv of invoices) {
    const total = computeInvoiceTotals(
      itemsToLines(inv.items),
      Number(inv.taxRate),
      Number(inv.discount),
    ).total
    statusBreakdown[inv.status] = (statusBreakdown[inv.status] ?? 0) + total
    if (inv.status === 'OVERDUE') overdue += total
    if (inv.status === 'PENDING' || inv.status === 'OVERDUE') outstanding += total
  }

  // Revenue per month for the last 12 months (money actually received).
  const byMonth = new Map<string, number>()
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo)
    d.setUTCMonth(d.getUTCMonth() + i)
    byMonth.set(monthKey(d), 0)
  }
  for (const p of payments) {
    const key = monthKey(p.paidAt)
    if (byMonth.has(key)) byMonth.set(key, byMonth.get(key)! + Number(p.amount))
  }

  const paidReceived = payments.reduce((s, p) => s + Number(p.amount), 0)

  return ok({
    metrics: {
      revenue: {
        received: paidReceived,
        outstanding,
        overdue,
        statusBreakdown,
      },
      clients: clientCount,
      projects: projectCount,
      tasks: { open: openTaskCount, completed: completedTaskCount },
    },
    revenueByMonth: [...byMonth.entries()].map(([month, total]) => ({
      month,
      total: Math.round(total * 100) / 100,
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      kind: a.kind,
      text: a.text,
      detail: a.detail,
      createdAt: a.createdAt.toISOString(),
    })),
    overdueInvoices: overdueInvoices.map((i) => ({
      id: i.id,
      number: i.number,
      company: i.client?.company ?? 'Unknown client',
      dueDate: i.dueDate.toISOString(),
      balance: Math.round(
        computeInvoiceTotals(itemsToLines(i.items), Number(i.taxRate), Number(i.discount)).total * 100,
      ) / 100,
    })),
  })
})

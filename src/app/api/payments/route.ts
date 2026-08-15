import { prisma } from '@/lib/prisma'
import { api, ok } from '@/lib/api'
import { requireWorkspaceContext } from '@/lib/workspace'

export const GET = api(async (req: Request) => {
  const { workspace } = await requireWorkspaceContext()

  const url = new URL(req.url)
  const invoiceId = url.searchParams.get('invoiceId')
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('per_page') ?? 20)))

  const where = {
    workspaceId: workspace.id,
    ...(invoiceId ? { invoiceId } : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        invoice: { select: { id: true, number: true, status: true } },
      },
    }),
  ])

  return ok({
    payments: rows.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      invoice: p.invoice,
      amount: Number(p.amount),
      method: p.method,
      paidAt: p.paidAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
    pagination: { page, perPage, total, pages: Math.ceil(total / perPage) },
  })
})

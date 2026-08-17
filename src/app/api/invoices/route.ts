import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { createInvoiceSchema } from '@/lib/validation/schemas'
import { nextInvoiceNumber, serializeInvoice } from '@/server/services/invoices'
import { recordActivity } from '@/server/services/activity'
import { invoiceCreatedEmail } from '@/server/services/email-templates'
import { sendEmail } from '@/server/services/email'

export const GET = api(async (req: Request) => {
  const { workspace } = await requireWorkspaceContext()

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
  const status = url.searchParams.get('status')?.toUpperCase()
  const clientId = url.searchParams.get('clientId')
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('per_page') ?? 20)))

  const where = {
    workspaceId: workspace.id,
    ...(clientId ? { clientId } : {}),
    ...(status && ['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)
      ? { status: status as never }
      : {}),
    ...(q
      ? { OR: [{ number: { contains: q, mode: 'insensitive' as const } }, { client: { company: { contains: q, mode: 'insensitive' as const } } }] }
      : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        client: { select: { id: true, company: true, name: true, email: true } },
        items: true,
        payments: { orderBy: { paidAt: 'asc' } },
      },
    }),
  ])

  return ok({
    invoices: rows.map(serializeInvoice),
    pagination: { page, perPage, total, pages: Math.ceil(total / perPage) },
  })
})

export const POST = api(async (req: Request) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const body = await parseBody(req, createInvoiceSchema)

  if (body.dueDate < body.issueDate) {
    throw new ApiError('VALIDATION_ERROR', 'Due date must be after the issue date.', 400)
  }

  const client = await prisma.client.findFirst({
    where: { id: body.clientId, workspaceId: workspace.id },
    select: { id: true, company: true, name: true, email: true },
  })
  if (!client) throw new ApiError('NOT_FOUND', 'Client not found.', 404)

  const number = await nextInvoiceNumber(workspace.id)

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        number,
        status: 'DRAFT',
        issueDate: body.issueDate,
        dueDate: body.dueDate,
        currency: body.currency,
        taxRate: body.taxRate,
        discount: body.discount,
        note: body.note ?? null,
        items: {
          create: body.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        client: { select: { id: true, company: true, name: true, email: true } },
        items: true,
        payments: true,
      },
    })
    await tx.activity.create({
      data: {
        workspaceId: workspace.id,
        kind: 'INVOICE_CREATED',
        text: `Invoice ${created.number} created`,
        detail: `${client.company} · draft`,
        invoiceId: created.id,
        clientId: client.id,
      },
    })
    return created
  })

  const serialized = serializeInvoice(invoice as never)

  // Notify the workspace owner via email (fire and forget).
  if (client.email) {
    void sendEmail({
      to: client.email,
      ...invoiceCreatedEmail({
        number: serialized.number,
        amount: serialized.total,
        clientName: client.name,
        issueDate: body.issueDate,
        dueDate: body.dueDate,
      }),
    })
  }

  return ok({ invoice: serialized }, { status: 201 })
})

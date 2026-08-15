import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin, requireOwner } from '@/lib/workspace'
import { updateInvoiceSchema, invoiceParamsSchema } from '@/lib/validation/schemas'
import { getWorkspaceInvoiceOrThrow, serializeInvoice, assertTransition } from '@/server/services/invoices'
import { recordActivity } from '@/server/services/activity'

type Params = { id: string }

export const GET = api(async (_req: Request, ctx: { params: Promise<Params> }) => {
  const { workspace } = await requireWorkspaceContext()
  const { id } = invoiceParamsSchema.parse(await ctx.params)
  const invoice = await getWorkspaceInvoiceOrThrow(workspace.id, id)
  const client = await prisma.client.findFirst({
    where: { id: invoice.clientId, workspaceId: workspace.id },
    select: { id: true, company: true, name: true, email: true },
  })
  return ok({ invoice: { ...serializeInvoice(invoice), client } })
})

export const PATCH = api(async (req: Request, ctx: { params: Promise<Params> }) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const { id } = invoiceParamsSchema.parse(await ctx.params)
  const body = await parseBody(req, updateInvoiceSchema)

  const existing = await getWorkspaceInvoiceOrThrow(workspace.id, id)
  if (existing.status !== 'DRAFT') {
    throw new ApiError('INVOICE_LOCKED', 'Only draft invoices can be edited.', 409)
  }

  if (body.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: body.clientId, workspaceId: workspace.id },
      select: { id: true },
    })
    if (!client) throw new ApiError('NOT_FOUND', 'Client not found.', 404)
  }
  if (body.issueDate && body.dueDate && body.dueDate < body.issueDate) {
    throw new ApiError('VALIDATION_ERROR', 'Due date must be after the issue date.', 400)
  }

  const invoice = await prisma.$transaction(async (tx) => {
    if (body.items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
    }
    return tx.invoice.update({
      where: { id },
      data: {
        ...(body.clientId !== undefined ? { clientId: body.clientId } : {}),
        ...(body.issueDate !== undefined ? { issueDate: body.issueDate } : {}),
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
        ...(body.taxRate !== undefined ? { taxRate: body.taxRate } : {}),
        ...(body.discount !== undefined ? { discount: body.discount } : {}),
        ...(body.note !== undefined ? { note: body.note ?? null } : {}),
        ...(body.items
          ? {
              items: {
                create: body.items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
              },
            }
          : {}),
      },
      include: { items: true, payments: true, client: true },
    })
  })

  await recordActivity({
    workspaceId: workspace.id,
    kind: 'INVOICE_UPDATED',
    text: `Invoice ${invoice.number} updated`,
    invoiceId: invoice.id,
    clientId: invoice.clientId,
  })

  return ok({ invoice: serializeInvoice(invoice as never) })
})

export const DELETE = api(async (_req: Request, ctx: { params: Promise<Params> }) => {
  const authCtx = await requireWorkspaceContext()
  requireOwner(authCtx)
  const { workspace } = authCtx
  const { id } = invoiceParamsSchema.parse(await ctx.params)

  const existing = await getWorkspaceInvoiceOrThrow(workspace.id, id)
  if (existing.status !== 'DRAFT') {
    throw new ApiError('INVOICE_LOCKED', 'Only draft invoices can be deleted.', 409)
  }

  await prisma.invoice.delete({ where: { id } })
  await recordActivity({
    workspaceId: workspace.id,
    kind: 'INVOICE_UPDATED',
    text: `Invoice ${existing.number} deleted`,
    invoiceId: existing.id,
  })

  return ok({ deleted: true })
})

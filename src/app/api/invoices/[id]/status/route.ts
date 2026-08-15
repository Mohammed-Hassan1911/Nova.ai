import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { invoiceParamsSchema, invoiceStatusSchema } from '@/lib/validation/schemas'
import { getWorkspaceInvoiceOrThrow, serializeInvoice, assertTransition } from '@/server/services/invoices'

export const PATCH = api(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const { id } = invoiceParamsSchema.parse(await ctx.params)
  const body = await parseBody(req, invoiceStatusSchema)

  const existing = await getWorkspaceInvoiceOrThrow(workspace.id, id)
  assertTransition(existing.status, body.status)

  const invoice = await prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: {
        status: body.status,
        ...(body.status === 'PENDING' && !existing.sentAt ? { sentAt: new Date() } : {}),
      },
      include: { items: true, payments: true, client: true },
    })
    await tx.activity.create({
      data: {
        workspaceId: workspace.id,
        kind: 'INVOICE_UPDATED',
        text: `Invoice ${updated.number} ${body.status.toLowerCase()}`,
        detail: `Status changed from ${existing.status}`,
        invoiceId: updated.id,
        clientId: updated.clientId,
      },
    })
    return updated
  })

  return ok({ invoice: serializeInvoice(invoice) })
})

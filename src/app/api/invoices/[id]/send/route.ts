import { prisma } from '@/lib/prisma'
import { api, ok } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { invoiceParamsSchema } from '@/lib/validation/schemas'
import { getWorkspaceInvoiceOrThrow, serializeInvoice, assertTransition } from '@/server/services/invoices'
import { invoiceCreatedEmail } from '@/server/services/email-templates'
import { sendEmail } from '@/server/services/email'

export const POST = api(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const { id } = invoiceParamsSchema.parse(await ctx.params)
  const existing = await getWorkspaceInvoiceOrThrow(workspace.id, id)

  assertTransition(existing.status, 'PENDING')

  const invoice = await prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: { status: 'PENDING', sentAt: new Date() },
      include: { items: true, payments: true, client: true },
    })
    await tx.activity.create({
      data: {
        workspaceId: workspace.id,
        kind: 'INVOICE_SENT',
        text: `Invoice ${updated.number} sent`,
        detail: 'Marked as pending',
        invoiceId: updated.id,
        clientId: updated.clientId,
      },
    })
    return updated
  })

  const serialized = serializeInvoice(invoice)
  if (invoice.client?.email) {
    void sendEmail({
      to: invoice.client.email,
      ...invoiceCreatedEmail({
        number: serialized.number,
        amount: serialized.total,
        clientName: invoice.client.name,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
      }),
    })
  }

  return ok({ invoice: serialized })
})

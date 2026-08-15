import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { createPaymentSchema, invoiceParamsSchema } from '@/lib/validation/schemas'
import { markInvoicePaid, serializeInvoice } from '@/server/services/invoices'
import { invoicePaidEmail } from '@/server/services/email-templates'
import { sendEmail } from '@/server/services/email'

export const POST = api(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const { id } = invoiceParamsSchema.parse(await ctx.params)
  const body = await parseBody(req, createPaymentSchema)

  if (body.invoiceId !== id) {
    throw new ApiError('VALIDATION_ERROR', 'Invoice id does not match the route.', 400)
  }

  const invoice = await prisma.$transaction((tx) =>
    markInvoicePaid(workspace.id, id, {
      amount: body.amount,
      method: body.method,
      paidAt: body.paidAt ?? undefined,
    }, tx),
  )

  const serialized = serializeInvoice(invoice)
  const client = await prisma.client.findFirst({
    where: { id: invoice.clientId, workspaceId: workspace.id },
    select: { email: true },
  })
  if (client?.email) {
    void sendEmail({
      to: client.email,
      ...invoicePaidEmail({
        number: serialized.number,
        amount: serialized.total,
        clientName: client.email,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
      }),
    })
  }

  return ok({ invoice: serialized })
})

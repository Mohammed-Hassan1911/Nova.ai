import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext } from '@/lib/workspace'
import { invoiceParamsSchema } from '@/lib/validation/schemas'
import { getWorkspaceInvoiceOrThrow } from '@/server/services/invoices'
import { renderInvoicePdf } from '@/server/services/pdf'

export const GET = async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { workspace } = await requireWorkspaceContext()
  const { id } = invoiceParamsSchema.parse(await ctx.params)
  const invoice = await getWorkspaceInvoiceOrThrow(workspace.id, id)

  const client = await prisma.client.findFirst({
    where: { id: invoice.clientId, workspaceId: workspace.id },
  })
  if (!client) throw new ApiError('NOT_FOUND', 'Client not found.', 404)

  const pdf = await renderInvoicePdf(invoice, client)
  const bytes = new Uint8Array(pdf)

  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.number}.pdf"`,
      'Content-Length': String(bytes.length),
    },
  })
}

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionUser, getWorkspaceContext } from '@/lib/workspace'
import { serializeInvoice } from '@/server/services/invoices'
import { InvoicesView } from './invoices-view'
import type { Invoice } from '@/lib/types'

export default async function InvoicesPage() {
  const ctx = await getWorkspaceContext()
  if (!ctx) {
    const user = await getSessionUser()
    redirect(user ? '/onboarding' : '/login')
  }

  const rows = await prisma.invoice.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, company: true, name: true, email: true } },
      items: true,
      payments: { orderBy: { paidAt: 'asc' } },
    },
  })

  const invoices: Invoice[] = rows.map((r) => serializeInvoice(r as never))

  return <InvoicesView initialInvoices={invoices} />
}

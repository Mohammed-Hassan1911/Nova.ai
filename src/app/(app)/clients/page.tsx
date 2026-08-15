import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionUser, getWorkspaceContext } from '@/lib/workspace'
import { ClientsView } from './clients-view'
import type { Client } from '@/lib/types'

export default async function ClientsPage() {
  const ctx = await getWorkspaceContext()
  if (!ctx) {
    const user = await getSessionUser()
    redirect(user ? '/onboarding' : '/login')
  }

  const where = { workspaceId: ctx.workspace.id }
  const [total, rows] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { _count: { select: { projects: true, invoices: true } } },
    }),
  ])

  const clients: Client[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company,
    email: r.email,
    phone: r.phone,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    _count: { projects: r._count.projects, invoices: r._count.invoices },
  }))

  return <ClientsView initialClients={clients} initialTotal={total} />
}

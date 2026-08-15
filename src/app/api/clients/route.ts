import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { createClientSchema } from '@/lib/validation/schemas'
import { recordActivity } from '@/server/services/activity'
import { sweepIfDue } from '@/server/services/notifications'

export const GET = api(async (req: Request) => {
  const { workspace } = await requireWorkspaceContext()
  await sweepIfDue()

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
  const status = url.searchParams.get('status')?.toUpperCase()
  const sort = url.searchParams.get('sort') ?? 'recent'
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('per_page') ?? 20)))

  const where = {
    workspaceId: workspace.id,
    ...(status && ['ACTIVE', 'PROSPECT', 'INACTIVE'].includes(status) ? { status: status as never } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { company: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [total, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: sort === 'name' ? { company: 'asc' } : { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { _count: { select: { projects: true, invoices: true } } },
    }),
  ])

  return ok({ clients, pagination: { page, perPage, total, pages: Math.ceil(total / perPage) } })
})

export const POST = api(async (req: Request) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const body = await parseBody(req, createClientSchema)

  const client = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: body.name,
      company: body.company,
      email: body.email ?? null,
      phone: body.phone ?? null,
      status: body.status,
      notes: body.notes ?? null,
    },
  })

  await recordActivity({
    workspaceId: workspace.id,
    kind: 'CLIENT_CREATED',
    text: `Client created — ${client.company}`,
    detail: client.name,
    clientId: client.id,
  })

  return ok({ client }, { status: 201 })
})

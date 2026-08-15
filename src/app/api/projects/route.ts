import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { createProjectSchema, updateProjectSchema, projectParamsSchema } from '@/lib/validation/schemas'
import { recordActivity } from '@/server/services/activity'

export const GET = api(async (req: Request) => {  const { workspace } = await requireWorkspaceContext()
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
  const status = url.searchParams.get('status')?.toUpperCase()
  const clientId = url.searchParams.get('clientId')
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('per_page') ?? 20)))

  const where = {
    workspaceId: workspace.id,
    ...(clientId ? { clientId } : {}),
    ...(status && ['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED'].includes(status)
      ? { status: status as never }
      : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
  }

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        client: { select: { id: true, company: true, name: true } },
        _count: { select: { tasks: true } },
      },
    }),
  ])

  return ok({ projects, pagination: { page, perPage, total, pages: Math.ceil(total / perPage) } })
})

export const POST = api(async (req: Request) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const body = await parseBody(req, createProjectSchema)

  if (body.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: body.clientId, workspaceId: workspace.id },
      select: { id: true },
    })
    if (!client) throw new ApiError('NOT_FOUND', 'Client not found.', 404)
  }

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: body.name,
      clientId: body.clientId ?? null,
      description: body.description ?? null,
      status: body.status,
      progress: body.progress,
      budget: body.budget,
      spent: body.spent,
      deadline: body.deadline,
    },
  })

  await recordActivity({
    workspaceId: workspace.id,
    kind: 'PROJECT_CREATED',
    text: `Project created — ${project.name}`,
    projectId: project.id,
    clientId: body.clientId ?? null,
  })

  return ok({ project }, { status: 201 })
})

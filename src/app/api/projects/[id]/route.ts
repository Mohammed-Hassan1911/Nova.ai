import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin, requireOwner } from '@/lib/workspace'
import { updateProjectSchema, projectParamsSchema } from '@/lib/validation/schemas'
import { recordActivity } from '@/server/services/activity'

type Params = { id: string }

export const GET = api(async (_req: Request, ctx: { params: Promise<Params> }) => {
  const { workspace } = await requireWorkspaceContext()
  const { id } = projectParamsSchema.parse(await ctx.params)

  const project = await prisma.project.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      client: { select: { id: true, company: true, name: true, email: true } },
      tasks: { orderBy: { createdAt: 'desc' } },
      _count: { select: { tasks: true } },
    },
  })
  if (!project) throw new ApiError('NOT_FOUND', 'Project not found.', 404)

  return ok({ project })
})

export const PATCH = api(async (req: Request, ctx: { params: Promise<Params> }) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const { id } = projectParamsSchema.parse(await ctx.params)
  const body = await parseBody(req, updateProjectSchema)

  const existing = await prisma.project.findFirst({ where: { id, workspaceId: workspace.id } })
  if (!existing) throw new ApiError('NOT_FOUND', 'Project not found.', 404)

  if (body.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: body.clientId, workspaceId: workspace.id },
      select: { id: true },
    })
    if (!client) throw new ApiError('NOT_FOUND', 'Client not found.', 404)
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.clientId !== undefined ? { clientId: body.clientId ?? null } : {}),
      ...(body.description !== undefined ? { description: body.description ?? null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.progress !== undefined ? { progress: body.progress } : {}),
      ...(body.budget !== undefined ? { budget: body.budget } : {}),
      ...(body.spent !== undefined ? { spent: body.spent } : {}),
      ...(body.deadline !== undefined ? { deadline: body.deadline } : {}),
    },
  })

  const completed = project.status === 'COMPLETED' && existing.status !== 'COMPLETED'
  await recordActivity({
    workspaceId: workspace.id,
    kind: completed ? 'PROJECT_COMPLETED' : 'PROJECT_UPDATED',
    text: completed ? `Project completed — ${project.name}` : `Project updated — ${project.name}`,
    detail: `Progress: ${project.progress}%`,
    projectId: project.id,
    clientId: project.clientId,
  })

  return ok({ project })
})

export const DELETE = api(async (_req: Request, ctx: { params: Promise<Params> }) => {
  const authCtx = await requireWorkspaceContext()
  requireOwner(authCtx)
  const { workspace } = authCtx
  const { id } = projectParamsSchema.parse(await ctx.params)

  const existing = await prisma.project.findFirst({ where: { id, workspaceId: workspace.id } })
  if (!existing) throw new ApiError('NOT_FOUND', 'Project not found.', 404)

  await prisma.$transaction(async (tx) => {
    await tx.project.delete({ where: { id } })
    await tx.activity.create({
      data: {
        workspaceId: workspace.id,
        kind: 'PROJECT_UPDATED',
        text: `Project deleted — ${existing.name}`,
      },
    })
  })

  return ok({ deleted: true })
})

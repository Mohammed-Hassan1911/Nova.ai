import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin, requireOwner } from '@/lib/workspace'
import { updateTaskSchema, taskParamsSchema } from '@/lib/validation/schemas'
import { recordActivity } from '@/server/services/activity'

type Params = { id: string }

export const GET = api(async (_req: Request, ctx: { params: Promise<Params> }) => {
  const { workspace } = await requireWorkspaceContext()
  const { id } = taskParamsSchema.parse(await ctx.params)
  const task = await prisma.task.findFirst({
    where: { id, workspaceId: workspace.id },
    include: { project: { select: { id: true, name: true } } },
  })
  if (!task) throw new ApiError('NOT_FOUND', 'Task not found.', 404)
  return ok({ task })
})

export const PATCH = api(async (req: Request, ctx: { params: Promise<Params> }) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const { id } = taskParamsSchema.parse(await ctx.params)
  const body = await parseBody(req, updateTaskSchema)

  const existing = await prisma.task.findFirst({ where: { id, workspaceId: workspace.id } })
  if (!existing) throw new ApiError('NOT_FOUND', 'Task not found.', 404)

  if (body.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: body.projectId, workspaceId: workspace.id },
      select: { id: true },
    })
    if (!project) throw new ApiError('NOT_FOUND', 'Project not found.', 404)
  }

  const nextStatus = body.status ?? existing.status
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description ?? null } : {}),
      ...(body.projectId !== undefined ? { projectId: body.projectId ?? null } : {}),
      ...(body.priority !== undefined ? { priority: body.priority } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
      ...(nextStatus === 'COMPLETED' && existing.status !== 'COMPLETED'
        ? { completedAt: new Date() }
        : nextStatus !== 'COMPLETED' && existing.status === 'COMPLETED'
          ? { completedAt: null }
          : {}),
    },
  })

  if (nextStatus === 'COMPLETED' && existing.status !== 'COMPLETED') {
    await recordActivity({
      workspaceId: workspace.id,
      kind: 'TASK_COMPLETED',
      text: `Task completed — ${task.title}`,
      projectId: task.projectId,
      taskId: task.id,
    })
  }

  return ok({ task })
})

export const DELETE = api(async (_req: Request, ctx: { params: Promise<Params> }) => {
  const authCtx = await requireWorkspaceContext()
  requireOwner(authCtx)
  const { workspace } = authCtx
  const { id } = taskParamsSchema.parse(await ctx.params)

  const existing = await prisma.task.findFirst({ where: { id, workspaceId: workspace.id } })
  if (!existing) throw new ApiError('NOT_FOUND', 'Task not found.', 404)

  await prisma.task.delete({ where: { id } })
  return ok({ deleted: true })
})

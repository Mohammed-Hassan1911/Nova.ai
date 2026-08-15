import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { createTaskSchema } from '@/lib/validation/schemas'
import { recordActivity } from '@/server/services/activity'

export const GET = api(async (req: Request) => {
  const { workspace } = await requireWorkspaceContext()
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
  const status = url.searchParams.get('status')?.toUpperCase()
  const priority = url.searchParams.get('priority')?.toUpperCase()
  const projectId = url.searchParams.get('projectId')
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') ?? 50)))

  const where = {
    workspaceId: workspace.id,
    ...(projectId ? { projectId } : {}),
    ...(status && ['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(status)
      ? { status: status as never }
      : {}),
    ...(priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)
      ? { priority: priority as never }
      : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
  }

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: { project: { select: { id: true, name: true } } },
    }),
  ])

  return ok({ tasks, pagination: { page, perPage, total, pages: Math.ceil(total / perPage) } })
})

export const POST = api(async (req: Request) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const body = await parseBody(req, createTaskSchema)

  if (body.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: body.projectId, workspaceId: workspace.id },
      select: { id: true },
    })
    if (!project) throw new ApiError('NOT_FOUND', 'Project not found.', 404)
  }

  const task = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: body.title,
      description: body.description ?? null,
      projectId: body.projectId ?? null,
      priority: body.priority,
      status: body.status,
      dueDate: body.dueDate,
      ...(body.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
    },
  })

  await recordActivity({
    workspaceId: workspace.id,
    kind: body.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_CREATED',
    text: body.status === 'COMPLETED'
      ? `Task completed — ${task.title}`
      : `Task created — ${task.title}`,
    projectId: task.projectId,
    taskId: task.id,
  })

  return ok({ task }, { status: 201 })
})

import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext } from '@/lib/workspace'
import { createTaskSchema } from '@/lib/validation/schemas'
import { recordActivity } from '@/server/services/activity'
import type { Task } from '@/lib/types'

export const GET = api(async (req: Request) => {
  const { workspace } = await requireWorkspaceContext()

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
  const status = url.searchParams.get('status')?.toUpperCase() ?? 'ALL'
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') ?? 50)))

  const where = {
    workspaceId: workspace.id,
    ...(status === 'OPEN'
      ? { status: { not: 'COMPLETED' as const } }
      : status === 'COMPLETED'
        ? { status: 'COMPLETED' as const }
        : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { project: { name: { contains: q, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: { project: { select: { id: true, name: true } } },
    }),
  ])

  const tasks: Task[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    dueDate: r.dueDate ? r.dueDate.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    projectId: r.projectId,
    createdAt: r.createdAt.toISOString(),
    project: r.project ? { id: r.project.id, name: r.project.name } : null,
  }))

  return ok({ tasks, pagination: { page, perPage, total, pages: Math.ceil(total / perPage) } })
})

export const POST = api(async (req: Request) => {
  const { workspace } = await requireWorkspaceContext()
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
    },
    include: { project: { select: { id: true, name: true } } },
  })

  await recordActivity({
    workspaceId: workspace.id,
    kind: 'TASK_CREATED',
    text: `Task created — ${task.title}`,
    projectId: task.projectId,
    taskId: task.id,
  })

  const serialized: Task = {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    projectId: task.projectId,
    createdAt: task.createdAt.toISOString(),
    project: task.project ? { id: task.project.id, name: task.project.name } : null,
  }

  return ok({ task: serialized })
})

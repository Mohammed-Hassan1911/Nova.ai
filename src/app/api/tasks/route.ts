import { prisma } from '@/lib/prisma'
import { api, ok } from '@/lib/api'
import { requireWorkspaceContext } from '@/lib/workspace'
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

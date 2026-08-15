import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionUser, getWorkspaceContext } from '@/lib/workspace'
import { TasksView } from './tasks-view'
import type { Task } from '@/lib/types'

export default async function TasksPage() {
  const ctx = await getWorkspaceContext()
  if (!ctx) {
    const user = await getSessionUser()
    redirect(user ? '/onboarding' : '/login')
  }

  const openWhere = { workspaceId: ctx.workspace.id, status: { not: 'COMPLETED' as const } }
  const completedWhere = { workspaceId: ctx.workspace.id, status: 'COMPLETED' as const }
  const [completedTotal, openRows, completedRows] = await Promise.all([
    prisma.task.count({ where: completedWhere }),
    prisma.task.findMany({
      where: openWhere,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      take: 200,
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.task.findMany({
      where: completedWhere,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      take: 50,
      include: { project: { select: { id: true, name: true } } },
    }),
  ])
  const rows = [...openRows, ...completedRows]

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

  return <TasksView initialTasks={tasks} initialCompletedTotal={completedTotal} />
}

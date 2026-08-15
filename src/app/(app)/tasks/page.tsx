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

  const rows = await prisma.task.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    take: 100,
    include: { project: { select: { id: true, name: true } } },
  })

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

  return <TasksView initialTasks={tasks} />
}

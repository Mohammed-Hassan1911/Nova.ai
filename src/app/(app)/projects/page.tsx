import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionUser, getWorkspaceContext } from '@/lib/workspace'
import { ProjectsView } from './projects-view'
import type { Project } from '@/lib/types'

export default async function ProjectsPage() {
  const ctx = await getWorkspaceContext()
  if (!ctx) {
    const user = await getSessionUser()
    redirect(user ? '/onboarding' : '/login')
  }

  const where = { workspaceId: ctx.workspace.id }
  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        client: { select: { id: true, company: true } },
        _count: { select: { tasks: true } },
      },
    }),
  ])

  const projects: Project[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    status: r.status,
    progress: r.progress,
    budget: Number(r.budget),
    spent: Number(r.spent),
    deadline: r.deadline ? r.deadline.toISOString() : null,
    clientId: r.clientId,
    createdAt: r.createdAt.toISOString(),
    client: r.client ? { id: r.client.id, company: r.client.company } : null,
    _count: { tasks: r._count.tasks },
  }))

  return <ProjectsView initialProjects={projects} initialTotal={total} />
}

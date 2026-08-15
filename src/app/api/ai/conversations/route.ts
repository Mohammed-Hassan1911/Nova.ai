import { prisma } from '@/lib/prisma'
import { api, ok } from '@/lib/api'
import { requireAdmin, requireWorkspaceContext } from '@/lib/workspace'

export const GET = api(async (req: Request) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx

  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('per_page') ?? 50)))

  const where = { workspaceId: workspace.id }
  const [total, rows] = await Promise.all([
    prisma.aIConversation.count({ where }),
    prisma.aIConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 100 },
      },
    }),
  ])

  const conversations = rows.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    messages: c.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolName: m.toolName,
      createdAt: m.createdAt.toISOString(),
    })),
  }))

  return ok({ conversations, pagination: { page, perPage, total, pages: Math.ceil(total / perPage) } })
})

import { prisma } from '@/lib/prisma'
import { api, ok } from '@/lib/api'
import { requireWorkspaceContext } from '@/lib/workspace'
import { unreadNotificationCount } from '@/server/services/notifications'

export const GET = api(async (req: Request) => {
  const { workspace } = await requireWorkspaceContext()

  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('per_page') ?? 30)))
  const unreadOnly = url.searchParams.get('unread') === 'true'

  const where = {
    workspaceId: workspace.id,
    ...(unreadOnly ? { readAt: null } : {}),
  }

  const [total, unread, rows] = await Promise.all([
    prisma.notification.count({ where }),
    unreadNotificationCount(workspace.id),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return ok({
    notifications: rows.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      detail: n.detail,
      link: n.link,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    unread,
    pagination: { page, perPage, total, pages: Math.ceil(total / perPage) },
  })
})

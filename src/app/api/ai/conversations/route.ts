import { prisma } from '@/lib/prisma'
import { api, ok } from '@/lib/api'
import { requireWorkspaceContext } from '@/lib/workspace'

export const GET = api(async () => {
  const { workspace } = await requireWorkspaceContext()
  const conversations = await prisma.aIConversation.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 100 },
    },
  })

  return ok({
    conversations: conversations.map((c) => ({
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
    })),
  })
})

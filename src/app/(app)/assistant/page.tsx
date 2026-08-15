import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionUser, getWorkspaceContext } from '@/lib/workspace'
import { AssistantView } from './assistant-view'
import type { Conversation } from '@/lib/types'

export default async function AssistantPage() {
  const ctx = await getWorkspaceContext()
  if (!ctx) {
    const user = await getSessionUser()
    redirect(user ? '/onboarding' : '/login')
  }

  if (ctx.membership.role === 'MEMBER') {
    redirect('/dashboard')
  }

  const [total, rows] = await Promise.all([
    prisma.aIConversation.count({ where: { workspaceId: ctx.workspace.id } }),
    prisma.aIConversation.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 100 },
      },
    }),
  ])

  const conversations: Conversation[] = rows.map((c) => ({
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

  return <AssistantView initialConversations={conversations} initialConversationTotal={total} />
}

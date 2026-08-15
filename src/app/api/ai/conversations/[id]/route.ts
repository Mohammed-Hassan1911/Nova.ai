import { prisma } from '@/lib/prisma'
import { api, ok } from '@/lib/api'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { aiConversationParamsSchema } from '@/lib/validation/schemas'

export const DELETE = api(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const { id } = aiConversationParamsSchema.parse(await ctx.params)

  const existing = await prisma.aIConversation.findFirst({
    where: { id, workspaceId: workspace.id },
    select: { id: true },
  })
  if (!existing) {
    return ok({ deleted: false })
  }

  await prisma.aIConversation.delete({ where: { id } })
  return ok({ deleted: true })
})

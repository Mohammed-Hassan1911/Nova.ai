import { api, ok, parseBody } from '@/lib/api'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { aiChatSchema } from '@/lib/validation/schemas'
import { runAgent } from '@/server/ai'
import { rateLimit, rateLimitedResponse, aiRateLimitConfig } from '@/lib/rate-limit'

export const POST = api(async (req: Request) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx

  const rl = await rateLimit({
    key: `${aiRateLimitConfig.chat.key}:${workspace.id}`,
    limit: aiRateLimitConfig.chat.limit,
    windowMs: aiRateLimitConfig.chat.windowMs,
  })
  if (rl.limited) return rateLimitedResponse(rl)

  const body = await parseBody(req, aiChatSchema)
  const result = await runAgent({
    workspaceId: workspace.id,
    conversationId: body.conversationId,
    message: body.message,
  })
  return ok(result)
})

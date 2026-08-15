import { api, ok, parseBody } from '@/lib/api'
import { requireWorkspaceContext, requireAdmin } from '@/lib/workspace'
import { aiConfirmSchema } from '@/lib/validation/schemas'
import { confirmAction } from '@/server/ai'
import { rateLimit, rateLimitedResponse, aiRateLimitConfig } from '@/lib/rate-limit'
import type { ToolName } from '@/server/ai/tools'

export const POST = api(async (req: Request) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx

  const rl = rateLimit({
    key: `${aiRateLimitConfig.confirm.key}:${workspace.id}`,
    limit: aiRateLimitConfig.confirm.limit,
    windowMs: aiRateLimitConfig.confirm.windowMs,
  })
  if (rl.limited) return rateLimitedResponse(rl)

  const body = await parseBody(req, aiConfirmSchema)
  const result = await confirmAction({
    workspaceId: workspace.id,
    conversationId: body.conversationId,
    toolName: body.toolName as ToolName,
    args: body.args,
  })
  return ok(result)
})

import { api, ok, parseBody } from '@/lib/api'
import { requireWorkspaceContext } from '@/lib/workspace'
import { notificationIdsSchema } from '@/lib/validation/schemas'
import { markNotificationsRead } from '@/server/services/notifications'

export const POST = api(async (req: Request) => {
  const { workspace } = await requireWorkspaceContext()
  const body = await parseBody(req, notificationIdsSchema)
  const updated = await markNotificationsRead(workspace.id, body.ids)
  return ok({ updated })
})

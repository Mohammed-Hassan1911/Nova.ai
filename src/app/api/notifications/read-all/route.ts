import { api, ok } from '@/lib/api'
import { requireWorkspaceContext } from '@/lib/workspace'
import { markAllNotificationsRead } from '@/server/services/notifications'

export const POST = api(async () => {
  const { workspace } = await requireWorkspaceContext()
  const updated = await markAllNotificationsRead(workspace.id)
  return ok({ updated })
})

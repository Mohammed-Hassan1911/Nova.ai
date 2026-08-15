import { api, ok } from '@/lib/api'
import { requireWorkspaceContext } from '@/lib/workspace'
import { unreadNotificationCount } from '@/server/services/notifications'

export const GET = api(async () => {
  const { workspace } = await requireWorkspaceContext()
  const unread = await unreadNotificationCount(workspace.id)
  return ok({ unread })
})

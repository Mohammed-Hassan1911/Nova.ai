import { cache } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/errors'
import type { MemberRole, Workspace, WorkspaceMember } from '@prisma/client'

export type AuthUser = { id: string; email: string; name: string | null }

/**
 * Returns the authenticated user or null. Never throws.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) return null
  return { id: session.user.id, email: session.user.email, name: session.user.name ?? null }
}

export interface WorkspaceContext {
  user: AuthUser
  workspace: Workspace
  membership: WorkspaceMember
}

/**
 * Derives the authenticated user's workspace from their membership.
 *
 * The workspace is NEVER taken from the client — it is always derived
 * server-side from the session, which guarantees workspace isolation.
 *
 * Wrapped in React `cache()` so the layout and page segments share one
 * auth + membership lookup per request instead of duplicating them.
 */
export const getWorkspaceContext = cache(async (): Promise<WorkspaceContext | null> => {
  const user = await getSessionUser()
  if (!user) return null

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    include: { workspace: true },
  })
  if (!membership) return null

  return { user, workspace: membership.workspace, membership }
})

/**
 * Like getWorkspaceContext but throws a 401-style error when there is no
 * session, or a 403-style error when the user has no workspace.
 */
export async function requireWorkspaceContext(): Promise<WorkspaceContext> {
  const ctx = await getWorkspaceContext()
  if (!ctx) {
    const user = await getSessionUser()
    if (!user) throw new ApiError('UNAUTHENTICATED', 'Your session has expired. Please sign in again.', 401)
    throw new ApiError('NO_WORKSPACE', 'You need to create a workspace before continuing.', 403)
  }
  return ctx
}

/**
 * Role-based access control.
 *
 * Policy:
 *  - MEMBER is read-only and may not mutate business data.
 *  - ADMIN may create/update business data but cannot delete it.
 *  - OWNER may do everything, including destructive operations.
 */
export function assertRole(ctx: WorkspaceContext, allowed: MemberRole[], message?: string): void {
  if (!allowed.includes(ctx.membership.role)) {
    throw new ApiError('FORBIDDEN', message ?? 'You do not have permission to perform this action.', 403)
  }
}

/** ADMIN and OWNER may mutate (create/update) business data. */
export const requireAdmin = (ctx: WorkspaceContext): void =>
  assertRole(ctx, ['ADMIN', 'OWNER'], 'Only admins can perform this action.')

/** Only the workspace OWNER may delete data or change settings. */
export const requireOwner = (ctx: WorkspaceContext): void =>
  assertRole(ctx, ['OWNER'], 'Only the workspace owner can perform this action.')

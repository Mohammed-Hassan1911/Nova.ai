import { cache } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/errors'
import { TTLCache } from '@/lib/cache'
import { envInt } from '@/lib/env'
import type { MemberRole, Workspace, WorkspaceMember } from '@prisma/client'

export type AuthUser = { id: string; email: string; name: string | null }

/**
 * Returns the authenticated user or null. Never throws.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) return null
    return { id: session.user.id, email: session.user.email, name: session.user.name ?? null }
  } catch (err) {
    console.error('[workspace] auth() threw:', err)
    return null
  }
}

export interface WorkspaceContext {
  user: AuthUser
  workspace: Workspace
  membership: WorkspaceMember
}

/**
 * Module-level TTL cache for workspace context lookups.
 *
 * Each Prisma query to Supavisor takes ~600-1100ms. Without caching, every
 * authenticated API request pays this cost. The TTL (30s default) limits
 * stale data to a short window while eliminating ~600ms per request.
 */
const WORKSPACE_CACHE_TTL_MS = envInt('WORKSPACE_CACHE_TTL_MS', 30_000)
const workspaceCache = new TTLCache<WorkspaceContext>(WORKSPACE_CACHE_TTL_MS)

/**
 * Slightly longer grace period used when the primary cache entry has expired
 * but the database is temporarily unreachable.  This prevents a thundering
 * herd of requests from all failing (and returning 401) during a brief
 * Supavisor connection-pool hiccup.
 */
const STALE_GRACE_MS = 30_000
const staleCache = new TTLCache<WorkspaceContext>(STALE_GRACE_MS)

export function invalidateWorkspaceCache(userId: string) {
  workspaceCache.delete(userId)
  staleCache.delete(userId)
}

/**
 * Derives the authenticated user's workspace from their membership.
 *
 * The workspace is NEVER taken from the client — it is always derived
 * server-side from the session, which guarantees workspace isolation.
 *
 * Uses a module-level TTL cache so API routes (separate HTTP requests)
 * share the auth + membership lookup within the TTL window, avoiding
 * redundant Prisma round-trips. React's `cache()` still deduplicates
 * within a single RSC render tree.
 */
export const getWorkspaceContext = cache(async (): Promise<WorkspaceContext | null> => {
  const user = await getSessionUser()
  if (!user) return null

  const cached = workspaceCache.get(user.id)
  if (cached) return cached

  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: { workspace: true },
    })
    if (!membership) return null

    const ctx: WorkspaceContext = { user, workspace: membership.workspace, membership }
    workspaceCache.set(user.id, ctx)
    // Also keep in the stale cache so we can serve stale data if the DB
    // goes down briefly.
    staleCache.set(user.id, ctx)
    return ctx
  } catch {
    // DB temporarily unavailable — fall back to a slightly stale entry
    // so requests don't all fail with 401 during transient pool issues.
    return staleCache.get(user.id) ?? null
  }
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

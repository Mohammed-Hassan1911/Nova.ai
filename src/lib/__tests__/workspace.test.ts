import { describe, it, expect, vi } from 'vitest'
import { ApiError } from '@/lib/errors'
import type { WorkspaceContext } from '@/lib/workspace'

// workspace.ts pulls in the full NextAuth stack; stub it so the test stays a
// pure unit test of the role-checking logic.
vi.mock('@/lib/auth', () => ({ auth: async () => null }))
vi.mock('@/lib/prisma', () => ({ prisma: {} }))

const { assertRole } = await import('@/lib/workspace')

const ctx = {
  user: { id: 'u1', email: 'a@b.c', name: null },
  workspace: { id: 'w1', name: 'Acme', businessType: null, nextInvoiceNumber: 1000, createdAt: new Date(), updatedAt: new Date() },
  membership: { id: 'm1', workspaceId: 'w1', userId: 'u1', role: 'OWNER' as const, createdAt: new Date() },
} as unknown as WorkspaceContext

describe('assertRole', () => {
  it('allows a role that is in the allowed list', () => {
    expect(() => assertRole(ctx, ['OWNER'])).not.toThrow()
  })

  it('throws a 403 ApiError when the role is not allowed', () => {
    try {
      assertRole(ctx, ['ADMIN', 'MEMBER'])
      expect.unreachable('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(403)
      expect((e as ApiError).code).toBe('FORBIDDEN')
    }
  })
})

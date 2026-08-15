import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Integration test for the shared (Postgres) rate-limit store. Requires a
 * live DATABASE_URL. Skips unless NOVA_DB_TEST=1 — the default `npm test`
 * run stays DB-free.
 *
 * Run with: NOVA_DB_TEST=1 npx vitest run src/lib/__tests__/rate-limit-prisma.test.ts
 */
const runDbTests = process.env.NOVA_DB_TEST === '1'

describe('rateLimit prisma store', () => {
  it.skipIf(!runDbTests)('enforces the window and resets it after expiry', async () => {
    const key = `db-test:${Date.now()}-${Math.floor(Math.random() * 1e6)}`
    const prev = process.env.RATE_LIMIT_STORE
    process.env.RATE_LIMIT_STORE = 'prisma'
    try {
      const r1 = await rateLimit({ key, limit: 2, windowMs: 1500 })
      expect(r1.limited).toBe(false)
      const r2 = await rateLimit({ key, limit: 2, windowMs: 1500 })
      expect(r2.limited).toBe(false)
      const r3 = await rateLimit({ key, limit: 2, windowMs: 1500 })
      expect(r3.limited).toBe(true)

      await new Promise((res) => setTimeout(res, 1600))
      const after = await rateLimit({ key, limit: 2, windowMs: 1500 })
      expect(after.limited).toBe(false)
    } finally {
      if (prev === undefined) delete process.env.RATE_LIMIT_STORE
      else process.env.RATE_LIMIT_STORE = prev
      await prisma.rateLimitBucket.delete({ where: { key } }).catch(() => {})
    }
  })
})

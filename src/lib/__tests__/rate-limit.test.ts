import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))

const { rateLimit, ipKey, rateLimitStore } = await import('@/lib/rate-limit')

describe('rateLimit (memory store)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    delete process.env.RATE_LIMIT_STORE
  })
  afterEach(() => {
    vi.useRealTimers()
    delete process.env.RATE_LIMIT_STORE
  })

  it('allows requests up to the limit, then blocks with retry-after', async () => {
    const r1 = await rateLimit({ key: 't:1', limit: 3, windowMs: 60_000 })
    expect(r1).toMatchObject({ limited: false, remaining: 2 })

    await rateLimit({ key: 't:1', limit: 3, windowMs: 60_000 })
    const r3 = await rateLimit({ key: 't:1', limit: 3, windowMs: 60_000 })
    expect(r3).toMatchObject({ limited: false, remaining: 0 })

    const blocked = await rateLimit({ key: 't:1', limit: 3, windowMs: 60_000 })
    expect(blocked.limited).toBe(true)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets the window after it expires', async () => {
    await rateLimit({ key: 't:2', limit: 2, windowMs: 60_000 })
    await rateLimit({ key: 't:2', limit: 2, windowMs: 60_000 })
    expect((await rateLimit({ key: 't:2', limit: 2, windowMs: 60_000 })).limited).toBe(true)

    vi.advanceTimersByTime(61_000)
    expect((await rateLimit({ key: 't:2', limit: 2, windowMs: 60_000 })).limited).toBe(false)
  })

  it('keys are independent', async () => {
    await rateLimit({ key: 'a:1', limit: 1, windowMs: 60_000 })
    expect((await rateLimit({ key: 'a:1', limit: 1, windowMs: 60_000 })).limited).toBe(true)
    expect((await rateLimit({ key: 'a:2', limit: 1, windowMs: 60_000 })).limited).toBe(false)
  })
})

describe('ipKey', () => {
  const req = (headers: Record<string, string>) => new Request('http://localhost/x', { headers })

  it('prefers x-real-ip', () => {
    expect(ipKey(req({ 'x-real-ip': '203.0.113.9', 'x-forwarded-for': '6.6.6.6' }), 'login')).toBe(
      'login:203.0.113.9',
    )
  })

  it('uses the rightmost x-forwarded-for entry when x-real-ip is absent', () => {
    expect(ipKey(req({ 'x-forwarded-for': '203.0.113.1, 203.0.113.2, 10.0.0.1' }), 'login')).toBe(
      'login:10.0.0.1',
    )
  })

  it('normalizes IPv4-mapped IPv6 addresses', () => {
    expect(ipKey(req({ 'x-real-ip': '::ffff:203.0.113.9' }), 'login')).toBe('login:203.0.113.9')
  })

  it('collapses non-IP header values to "unknown"', () => {
    expect(ipKey(req({ 'x-real-ip': '<script>alert(1)</script>' }), 'login')).toBe('login:unknown')
    expect(ipKey(req({ 'x-forwarded-for': 'not-an-ip' }), 'login')).toBe('login:unknown')
  })

  it('falls back to "unknown" with no proxy headers', () => {
    expect(ipKey(req({}), 'login')).toBe('login:unknown')
  })
})

describe('rateLimitStore', () => {
  afterEach(() => {
    delete process.env.RATE_LIMIT_STORE
  })

  it('returns memory when unset or unknown', () => {
    delete process.env.RATE_LIMIT_STORE
    expect(rateLimitStore()).toBe('memory')
    process.env.RATE_LIMIT_STORE = 'redis'
    expect(rateLimitStore()).toBe('memory')
  })

  it('returns prisma when configured', () => {
    process.env.RATE_LIMIT_STORE = 'prisma'
    expect(rateLimitStore()).toBe('prisma')
  })
})

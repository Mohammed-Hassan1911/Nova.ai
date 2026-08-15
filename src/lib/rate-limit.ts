/**
 * Rate limiter with pluggable stores.
 *
 *  - `memory` (default): in-process Map with periodic stale-bucket
 *    eviction. Suitable for single-instance dev/test.
 *  - `prisma`: Postgres-backed fixed-window counters via an atomic
 *    `INSERT ... ON CONFLICT` upsert. Shared across instances/workers,
 *    so limits hold on Vercel or any multi-instance deployment. Set
 *    `RATE_LIMIT_STORE=prisma` (see .env.example).
 *
 * The store is chosen once per call from `RATE_LIMIT_STORE`. The rest of
 * the app only ever awaits `rateLimit()` and inspects the result.
 */
import { NextResponse } from 'next/server'
import { envInt } from '@/lib/env'
import { prisma } from '@/lib/prisma'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let lastSweepAt = 0
const SWEEP_INTERVAL_MS = 5 * 60_000
const STALE_BUCKET_TTL_MS = 10 * 60_000

export interface RateLimitResult {
  limited: boolean
  retryAfterSeconds: number
  remaining: number
}

export type RateLimitStore = 'memory' | 'prisma'

/** The active store, from RATE_LIMIT_STORE. Anything but "prisma" is memory. */
export function rateLimitStore(): RateLimitStore {
  return process.env.RATE_LIMIT_STORE === 'prisma' ? 'prisma' : 'memory'
}

async function memoryRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now()

  if (now - lastSweepAt > SWEEP_INTERVAL_MS) {
    lastSweepAt = now
    for (const [k, bucket] of buckets) {
      if (now - bucket.resetAt > STALE_BUCKET_TTL_MS) buckets.delete(k)
    }
  }

  const bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, retryAfterSeconds: 0, remaining: limit - 1 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { limited: true, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000), remaining: 0 }
  }
  return { limited: false, retryAfterSeconds: 0, remaining: limit - bucket.count }
}

async function prismaRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const windowSeconds = windowMs / 1000
  const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (${key}, 1, now() + (${windowSeconds} * interval '1 second'), now(), now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."resetAt" <= now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= now() THEN now() + (${windowSeconds} * interval '1 second') ELSE "RateLimitBucket"."resetAt" END,
      "updatedAt" = now()
    RETURNING "count", "resetAt"
  `
  const { count, resetAt } = rows[0]
  if (count > limit) {
    return { limited: true, retryAfterSeconds: Math.ceil((resetAt.getTime() - Date.now()) / 1000), remaining: 0 }
  }

  // Probabilistic sweep: expired buckets are no longer needed, so drop a few
  // on ~0.1% of calls instead of keeping every key forever.
  if (Math.random() < 0.001) {
    await prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => {})
  }

  return { limited: false, retryAfterSeconds: 0, remaining: limit - count }
}

export async function rateLimit(options: {
  key: string
  limit?: number
  windowMs?: number
}): Promise<RateLimitResult> {
  const { key, limit = 20, windowMs = 60_000 } = options
  return rateLimitStore() === 'prisma' ? prismaRateLimit(key, limit, windowMs) : memoryRateLimit(key, limit, windowMs)
}

/**
 * Normalizes a raw IP-ish string so keys are stable and cannot be abused
 * to grow the store (garbage, headers that are not IPs, IPv4-mapped IPv6).
 * Returns "unknown" when the value is not a recognizable IP.
 */
function normalizeIp(value: string | null | undefined): string {
  if (!value) return 'unknown'
  let ip = value.trim().toLowerCase()
  if (ip.startsWith('::ffff:')) ip = ip.slice('::ffff:'.length)
  const v4 = /^\d{1,3}(?:\.\d{1,3}){3}$/
  const v6 = /^[0-9a-f:]{2,45}$/
  if (v4.test(ip)) return ip
  if (v6.test(ip) && ip.includes(':')) return ip
  return 'unknown'
}

/**
 * Stable client key.
 *
 * Prefers `x-real-ip` (set by nginx/HAProxy-style proxies), then the
 * RIGHTMOST entry of `x-forwarded-for`, which is the peer address recorded
 * by the closest trusted proxy and so cannot be spoofed the way the
 * leftmost value can. Values are validated and normalized, and anything
 * that is not an IP collapses to "unknown" so clients cannot mint unlimited
 * distinct keys. This assumes the deployment terminates proxying with a
 * trusted platform (Vercel, nginx, etc.).
 */
export function ipKey(req: Request, scope: string): string {
  const real = req.headers.get('x-real-ip')
  const realIp = normalizeIp(real)
  if (realIp !== 'unknown') return `${scope}:${realIp}`

  const forwarded = req.headers.get('x-forwarded-for')
  const parts = forwarded?.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts?.length) {
    const ip = normalizeIp(parts[parts.length - 1]!)
    if (ip !== 'unknown') return `${scope}:${ip}`
  }
  return `${scope}:unknown`
}

/**
 * AI assistant rate limits, per authenticated workspace.
 *
 * Configurable via env with safe defaults. Values are read once at module
 * load; the store is chosen by RATE_LIMIT_STORE (memory per-instance, or
 * the shared Postgres store). Documented in .env.example. When a limit is
 * hit the caller returns rateLimitedResponse.
 */
export const aiRateLimitConfig = {
  chat: {
    key: 'ai:chat',
    limit: envInt('AI_RATE_LIMIT_REQUESTS', 30),
    windowMs: envInt('AI_RATE_LIMIT_WINDOW_MS', 60_000),
  },
  confirm: {
    key: 'ai:confirm',
    limit: envInt('AI_CONFIRM_RATE_LIMIT_REQUESTS', 10),
    windowMs: envInt('AI_RATE_LIMIT_WINDOW_MS', 60_000),
  },
}

/** Standard 429 response for an exceeded limit. Never leaks internals. */
export function rateLimitedResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Please try again in ${result.retryAfterSeconds}s.`,
      },
    },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } },
  )
}

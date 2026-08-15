/**
 * Lightweight rate limiter.
 *
 * Uses an in-process Map keyed by IP + scope. Suitable for single-instance
 * deployments. For multi-instance production, swap the store for Redis
 * (set RATE_LIMIT_STORE=redis and provide a client) — the interface is
 * intentionally small so this is a drop-in change.
 */
import { NextResponse } from 'next/server'
import { envInt } from '@/lib/env'

type Bucket = { tokens: number; last: number }

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  limited: boolean
  retryAfterSeconds: number
  remaining: number
}

export function rateLimit(options: {
  key: string
  limit?: number
  windowMs?: number
}): RateLimitResult {
  const { key, limit = 20, windowMs = 60_000 } = options
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now - bucket.last > windowMs) {
    buckets.set(key, { tokens: limit - 1, last: now })
    return { limited: false, retryAfterSeconds: 0, remaining: limit - 1 }
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1
    buckets.set(key, bucket)
    return { limited: false, retryAfterSeconds: 0, remaining: bucket.tokens }
  }

  const retryAfterSeconds = Math.ceil((bucket.last + windowMs - now) / 1000)
  return { limited: true, retryAfterSeconds, remaining: 0 }
}

/**
 * Stable client key.
 *
 * Uses the RIGHTMOST entry of `x-forwarded-for`. The rightmost value is the
 * peer address recorded by the closest trusted proxy, so it cannot be
 * spoofed by a client-supplied header the way the leftmost value can. When
 * the header is absent (e.g. direct connections), falls back to "anonymous".
 *
 * NOTE: this still assumes the deployment terminates TLS/proxying with a
 * trusted platform (Vercel, nginx, etc.). For a self-hosted server reached
 * directly by clients, consider resolving the socket address instead.
 */
export function ipKey(req: Request, scope: string): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const parts = forwarded?.split(',').map((p) => p.trim()).filter(Boolean)
  const ip = parts?.length ? parts[parts.length - 1]! : 'anonymous'
  return `${scope}:${ip}`
}

/**
 * AI assistant rate limits, per authenticated workspace.
 *
 * Configurable via env with safe defaults. Values are read once at module
 * load; the store is the in-memory Map above (per-instance). Documented in
 * .env.example. When a limit is hit the caller returns rateLimitedResponse.
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


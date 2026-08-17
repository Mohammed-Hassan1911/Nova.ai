/**
 * Simple in-memory TTL cache for server-only data.
 *
 * Used to avoid repeated Prisma round-trips on hot paths (auth tokenVersion
 * checks, workspace lookups). Entries expire after `ttlMs` and are lazily
 * evicted on access.
 *
 * This is process-scoped: in production each serverless instance keeps its
 * own cache; in dev the single process shares one map.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TTLCache<T = unknown> {
  private map = new Map<string, CacheEntry<T>>()
  private ttlMs: number

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T): void {
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }

  delete(key: string): void {
    this.map.delete(key)
  }
}

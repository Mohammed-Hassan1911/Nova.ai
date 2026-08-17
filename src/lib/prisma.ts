import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Reuse a single PrismaClient per function instance in every environment
// (including production) so Vercel serverless invocations never spin up
// extra connection pools. globalThis persists across warm invocations.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

globalForPrisma.prisma = prisma

/**
 * Check whether the Prisma pool can serve queries. Returns true if healthy,
 * false if all connections are dead and the pool is stuck.
 */
export async function isPrismaHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

/**
 * Default per-query timeout (ms).  If a query hangs this long it is
 * cancelled and retried once.  Prevents stale Supavisor connections
 * from blocking a request indefinitely.
 */
const QUERY_TIMEOUT_MS = 8_000

/**
 * Run a Prisma query with one automatic retry on connection failure.
 *
 * Supavisor (transaction-mode PgBouncer) periodically closes idle server-
 * side connections.  Prisma's client-side pool doesn't learn about this
 * until it tries to use the stale connection, at which point the query
 * fails and the dead connection stays in the pool.  With a small pool
 * (connection_limit=5) and bursty traffic (e.g. dashboard loading 4+
 * API routes in parallel), this quickly exhausts every slot.
 *
 * This helper catches connection-level errors (`P2024` / "Timed out" /
 * "Can't reach database"), waits briefly for Supavisor to accept a fresh
 * connection, then retries once.  Application-level errors (constraint
 * violations, bad SQL, etc.) are NOT retried.
 *
 * If a query *hangs* (stale connection, no error thrown) it is
 * cancelled after QUERY_TIMEOUT_MS and retried once.  This prevents
 * a single bad connection from blocking the entire request.
 */
export async function prismaQuery<T>(fn: () => Promise<T>): Promise<T> {
  const run = async () => {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new QueryTimeoutError()), QUERY_TIMEOUT_MS),
        ),
      ])
    } catch (err) {
      if (err instanceof QueryTimeoutError || isConnectionError(err)) {
        // Brief pause — lets Supavisor recycle its server-side connections.
        await sleep(250)
        return fn()
      }
      throw err
    }
  }
  return run()
}

class QueryTimeoutError extends Error {
  constructor() {
    super('Query timed out')
    this.name = 'QueryTimeoutError'
  }
}

function isConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2024 = "Timed out fetching a new connection from the connection pool"
    if (err.code === 'P2024') return true
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes('timed out') && msg.includes('connection pool')) return true
    if (msg.includes("can't reach database")) return true
    if (msg.includes('server has closed the connection')) return true
    if (msg.includes('connection closed')) return true
  }
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

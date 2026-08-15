/**
 * Server-side env helpers.
 *
 * These read process.env at module load time. Keep this file server-only:
 * it must never be imported from client components.
 */

/** Reads an integer env var, falling back when unset, unparseable, or <= 0. */
export function envInt(name: string, fallback: number): number {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

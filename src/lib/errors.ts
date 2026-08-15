/**
 * Application error type with a stable machine-readable code.
 * Raw errors are never exposed to clients; they are logged server-side.
 */
import { ZodError } from 'zod'

export class ApiError extends Error {
  code: string
  status: number
  fields?: Record<string, string>

  constructor(code: string, message: string, status = 400, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fields = fields
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError

export function toApiError(e: unknown): ApiError {
  if (isApiError(e)) return e
  // Schema validation failures are a client contract violation, not a server bug.
  if (e instanceof ZodError) {
    return new ApiError(
      'VALIDATION_ERROR',
      e.issues[0]?.message ?? 'Invalid input.',
      400,
      Object.fromEntries(e.issues.map((issue) => [issue.path.join('.'), issue.message])),
    )
  }
  // Unknown failure — hide details from the client, log full context server-side.
  console.error('[api] unexpected error:', e)
  return new ApiError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500)
}

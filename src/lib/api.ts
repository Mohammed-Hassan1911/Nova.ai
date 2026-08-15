import { NextResponse } from 'next/server'
import { ZodError, type ZodType, type ZodTypeDef } from 'zod'
import { ApiError, toApiError } from '@/lib/errors'

/** Consistent success envelope: { success: true, data } */
export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ success: true, data }, init)
}

/** Consistent error envelope: { success: false, error: { code, message } } */
export function fail(error: unknown): NextResponse {
  const apiError = toApiError(error)
  return NextResponse.json(
    { success: false, error: { code: apiError.code, message: apiError.message } },
    { status: apiError.status },
  )
}

export function zodFail(error: ZodError): NextResponse {
  const first = error.issues[0]
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: first?.message ?? 'Invalid input.',
        fields: Object.fromEntries(
          error.issues.map((issue) => [issue.path.join('.'), issue.message]),
        ),
      },
    },
    { status: 400 },
  )
}

type Handler<T = unknown> = (req: Request, ctx: { params: Promise<T> }) => Promise<NextResponse>

/**
 * Wraps an API route handler with consistent error handling.
 * Converts thrown ApiError/ZodError/unknown errors into the error envelope
 * and guarantees a valid JSON response in every case.
 */
export function api<T = unknown>(handler: Handler<T>): Handler<T> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (e) {
      return fail(e)
    }
  }
}

/** Parses JSON body against a Zod schema. Throws ApiError on bad input. */
export async function parseBody<O, I>(req: Request, schema: ZodType<O, ZodTypeDef, I>): Promise<O> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new ApiError('INVALID_JSON', 'Request body is not valid JSON.', 400)
  }
  const result = schema.safeParse(raw)
  if (!result.success) throw new ZodError(result.error.issues)
  return result.data
}

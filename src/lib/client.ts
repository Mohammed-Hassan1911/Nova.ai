type Success<T> = { success: true; data: T }
type Failure = { success: false; error: { code: string; message: string; fields?: Record<string, string> } }

export type ApiResponse<T> = Success<T> | Failure

export class ApiClientError extends Error {
  code: string
  status: number
  fields?: Record<string, string>

  constructor(error: { code: string; message: string; fields?: Record<string, string> }, status: number) {
    super(error.message)
    this.name = 'ApiClientError'
    this.code = error.code
    this.status = status
    this.fields = error.fields
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, signal } = opts

  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiClientError({ code: 'NETWORK_ERROR', message: 'Could not reach the server. Check your connection.' }, 0)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ApiClientError({ code: 'BAD_RESPONSE', message: 'The server returned an unexpected response.' }, response.status)
  }

  const parsed = payload as ApiResponse<T>
  if (!parsed || typeof parsed.success !== 'boolean') {
    throw new ApiClientError({ code: 'BAD_RESPONSE', message: 'The server returned an unexpected response.' }, response.status)
  }

  if (!parsed.success) {
    throw new ApiClientError(parsed.error, response.status)
  }

  return parsed.data
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => apiFetch<T>(path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { method: 'POST', body, ...opts }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { method: 'PATCH', body, ...opts }),
  del: <T>(path: string, opts?: RequestOptions) => apiFetch<T>(path, { method: 'DELETE', ...opts }),
}

export function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const s = search.toString()
  return s ? `?${s}` : ''
}

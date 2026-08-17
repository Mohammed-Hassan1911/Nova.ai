/**
 * Shared client-side validation helpers.
 *
 * These mirror the Zod schemas in `schemas.ts` so that the same rules
 * are enforced on both client and server.  Each function returns `null`
 * when the value is valid, or a human-readable error string.
 */

/* ────────────────────────── helpers ────────────────────────── */

const EMAIL_RE =
  /^(?!.*\.\.)[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

/**
 * Egyptian mobile phone — accepted input formats:
 *   01012345678   (local, 11 digits starting with 01[0125])
 *   +201012345678 (E.164 with +)
 *
 * Rejected:
 *   010123         (too short)
 *   010123456789999 (too long)
 *   123456789999999 (wrong prefix)
 *   abc01012345678  (non-numeric)
 */
const EGYPTIAN_PHONE_RE = /^(?:01[0125]\d{8}|\+201[0125]\d{8})$/

/* ─────────────────────────── email ─────────────────────────── */

export function validateEmail(value: string): string | null {
  const v = value.trim()
  if (!v) return null                        // optional — caller decides
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.'
  return null
}

/** Returns the trimmed, lower-cased email or null when empty. */
export function normalizeEmail(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  return v.toLowerCase()
}

/* ────────────────────────── phone ──────────────────────────── */

/**
 * Validate an Egyptian mobile phone number.
 *
 * Accepts local format (01012345678) or E.164 (+201012345678).
 * Returns null when valid, or an error string.
 */
export function validatePhone(value: string): string | null {
  const v = value.trim()
  if (!v) return null                        // optional — caller decides
  if (!EGYPTIAN_PHONE_RE.test(v)) {
    return 'Enter a valid Egyptian mobile number (e.g. 01012345678).'
  }
  return null
}

/**
 * Normalize an Egyptian mobile phone to E.164 format.
 *
 * Accepts:
 *   01012345678  → +201012345678
 *   +201012345678 → +201012345678
 *
 * Returns null when empty or invalid (caller should have validated first).
 */
export function normalizePhone(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  const digits = v.replace(/\D/g, '')
  if (digits.startsWith('20') && digits.length === 12) {
    return `+${digits}`
  }
  if (digits.length === 11 && digits.startsWith('01')) {
    return `+20${digits}`
  }
  return null
}

/* ───────────────────────── text ────────────────────────────── */

export function validateRequiredText(
  value: string,
  label: string,
  max = 255,
): string | null {
  const v = value.trim()
  if (!v) return `${label} is required.`
  if (v.length > max) return `${label} is too long.`
  return null
}

/* ───────────────────── numbers / money ─────────────────────── */

export function validatePositiveNumber(value: string, label = 'Amount'): string | null {
  const v = value.trim()
  if (!v) return `${label} is required.`
  const n = Number(v)
  if (Number.isNaN(n) || n <= 0) return `Enter a valid ${label.toLowerCase()}.`
  return null
}

export function validateNonNegativeNumber(value: string, label = 'Amount'): string | null {
  const v = value.trim()
  if (!v) return null                        // often optional (budget)
  const n = Number(v)
  if (Number.isNaN(n) || n < 0) return `Enter a valid ${label.toLowerCase()}.`
  return null
}

export function validateInteger(
  value: string,
  label: string,
  min?: number,
  max?: number,
): string | null {
  const v = value.trim()
  if (!v) return `${label} is required.`
  const n = Number(v)
  if (Number.isNaN(n) || !Number.isInteger(n)) return `${label} must be a whole number.`
  if (min !== undefined && n < min) return `${label} must be at least ${min}.`
  if (max !== undefined && n > max) return `${label} must be at most ${max}.`
  return null
}

/* ─────────────────────── password ──────────────────────────── */

export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  return null
}

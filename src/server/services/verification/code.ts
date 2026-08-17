/**
 * Verification code generation, hashing, and validation.
 *
 * Codes are 6-digit numeric strings generated with crypto.randomInt()
 * for cryptographic security. They are stored as SHA-256 hashes in the
 * database so plaintext codes never persist.
 */
import { randomInt, createHash } from 'crypto'

const CODE_LENGTH = 6
const CODE_MAX = 10 ** CODE_LENGTH - 1 // 999999
const CODE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 5

/** Generate a cryptographically secure 6-digit code. */
export function generateCode(): string {
  return String(randomInt(0, CODE_MAX + 1)).padStart(CODE_LENGTH, '0')
}

/** SHA-256 hash of a code for secure storage. */
export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

/** Verify a user-entered code against a stored hash. */
export function verifyCode(plain: string, hash: string): boolean {
  return hashCode(plain) === hash
}

export { CODE_EXPIRY_MS, MAX_ATTEMPTS, CODE_LENGTH }

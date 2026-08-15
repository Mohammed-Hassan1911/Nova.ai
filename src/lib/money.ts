/**
 * Money arithmetic in integer cents to avoid floating-point drift.
 * Financial totals are ALWAYS computed server-side from these helpers.
 */

export function toCents(n: number | string | { toString(): string } | null | undefined): number {
  if (n === null || n === undefined) return 0
  const num = typeof n === 'object' ? Number(n.toString()) : Number(n)
  return Math.round(num * 100)
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100
}

export function addCents(...values: number[]): number {
  return values.reduce((s, v) => s + Math.round(v), 0)
}

/** taxRate is a percentage (e.g. 8 = 8%). Rounds to 2dp on the cents integer. */
export function calcTaxCents(subtotalCents: number, taxRate: number | string): number {
  const rate = Number(taxRate)
  if (!rate || rate <= 0) return 0
  return Math.round((subtotalCents * rate) / 100)
}

export function calcTotalCents(
  subtotalCents: number,
  taxCents: number,
  discountCents: number,
): number {
  return Math.max(0, subtotalCents + taxCents - discountCents)
}

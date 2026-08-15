import { describe, it, expect } from 'vitest'
import { toCents, fromCents, addCents, calcTaxCents, calcTotalCents } from '@/lib/money'

describe('toCents', () => {
  it('converts dollars to integer cents', () => {
    expect(toCents(1)).toBe(100)
    expect(toCents(12.5)).toBe(1250)
    expect(toCents(0.1)).toBe(10)
    expect(toCents('45.67')).toBe(4567)
    expect(toCents(null)).toBe(0)
    expect(toCents(undefined)).toBe(0)
  })
})

describe('fromCents', () => {
  it('converts cents back to dollars', () => {
    expect(fromCents(100)).toBe(1)
    expect(fromCents(199)).toBe(1.99)
    expect(fromCents(0)).toBe(0)
  })
})

describe('addCents', () => {
  it('sums without float drift', () => {
    expect(addCents(0.1, 0.2)).toBe(0)
    expect(addCents(100, 250)).toBe(350)
  })
})

describe('calcTaxCents', () => {
  it('computes percentage tax on cents', () => {
    expect(calcTaxCents(10000, 8)).toBe(800)
    expect(calcTaxCents(10000, 0)).toBe(0)
    expect(calcTaxCents(10000, '19')).toBe(1900)
  })
})

describe('calcTotalCents', () => {
  it('adds tax and subtracts discount, never negative', () => {
    expect(calcTotalCents(10000, 800, 0)).toBe(10800)
    expect(calcTotalCents(10000, 0, 500)).toBe(9500)
    expect(calcTotalCents(100, 0, 1000)).toBe(0)
  })
})

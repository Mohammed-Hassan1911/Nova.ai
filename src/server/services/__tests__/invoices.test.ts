import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'
import {
  computeInvoiceTotals,
  serializeInvoice,
  assertTransition,
  itemsToLines,
} from '@/server/services/invoices'

describe('computeInvoiceTotals', () => {
  it('computes subtotal, tax and total from line items', () => {
    const totals = computeInvoiceTotals(
      [
        { quantity: 2, unitPrice: 1250 },
        { quantity: 1, unitPrice: 850 },
      ],
      19,
      0,
    )
    expect(totals.subtotal).toBe(3350)
    expect(totals.tax).toBe(636.5)
    expect(totals.total).toBe(3986.5)
  })

  it('applies a discount before returning the final total', () => {
    const totals = computeInvoiceTotals([{ quantity: 1, unitPrice: 1000 }], 0, 100)
    expect(totals.total).toBe(900)
  })

  it('never returns a negative total', () => {
    const totals = computeInvoiceTotals([{ quantity: 1, unitPrice: 50 }], 0, 500)
    expect(totals.total).toBe(0)
  })

  it('treats quantity and price with fractional dollars exactly', () => {
    const totals = computeInvoiceTotals([{ quantity: 1.5, unitPrice: 99.99 }], 0, 0)
    expect(totals.subtotal).toBe(149.99)
  })
})

describe('itemsToLines', () => {
  it('maps Prisma decimals to numbers', () => {
    const lines = itemsToLines([
      { quantity: new Prisma.Decimal('2'), unitPrice: new Prisma.Decimal('12.50') },
    ])
    expect(lines[0]).toEqual({ description: '', quantity: 2, unitPrice: 12.5 })
  })
})

describe('serializeInvoice', () => {
  const base = {
    id: 'inv_1',
    workspaceId: 'ws_1',
    clientId: 'client_1',
    number: 'INV-1000',
    status: 'PENDING' as const,
    issueDate: new Date('2026-07-01'),
    dueDate: new Date('2026-07-31'),
    currency: 'USD',
    taxRate: new Prisma.Decimal('8'),
    discount: new Prisma.Decimal('0'),
    note: null,
    sentAt: null,
    paidAt: null,
    overdueNotifiedAt: null,
    createdAt: new Date('2026-07-01'),
    updatedAt: new Date('2026-07-01'),
    items: [
      {
        id: 'item_1',
        invoiceId: 'inv_1',
        description: 'Design work',
        quantity: new Prisma.Decimal('2'),
        unitPrice: new Prisma.Decimal('500'),
      },
    ],
    payments: [],
    client: { id: 'client_1', company: 'Acme', name: 'Jane', email: 'jane@acme.com' },
  }

  it('serializes totals, paid and balance', () => {
    const out = serializeInvoice(base)
    expect(out.number).toBe('INV-1000')
    expect(out.subtotal).toBe(1000)
    expect(out.tax).toBe(80)
    expect(out.total).toBe(1080)
    expect(out.paid).toBe(0)
    expect(out.balance).toBe(1080)
    expect(out.overdue).toBe(false)
  })

  it('reflects partial payments in balance', () => {
    const out = serializeInvoice({
      ...base,
      payments: [{ id: 'p1', amount: new Prisma.Decimal('300'), paidAt: new Date() }],
    })
    expect(out.paid).toBe(300)
    expect(out.balance).toBe(780)
  })

  it('flags overdue invoices', () => {
    const out = serializeInvoice({ ...base, status: 'OVERDUE' })
    expect(out.overdue).toBe(true)
  })
})

describe('assertTransition', () => {
  it('allows valid transitions', () => {
    expect(() => assertTransition('DRAFT', 'PENDING')).not.toThrow()
    expect(() => assertTransition('PENDING', 'PAID')).not.toThrow()
    expect(() => assertTransition('OVERDUE', 'CANCELLED')).not.toThrow()
  })

  it('rejects invalid transitions', () => {
    expect(() => assertTransition('PAID', 'PENDING')).toThrow()
    expect(() => assertTransition('CANCELLED', 'DRAFT')).toThrow()
    expect(() => assertTransition('DRAFT', 'PAID')).toThrow()
  })

  it('allows no-op transitions', () => {
    expect(() => assertTransition('DRAFT', 'DRAFT')).not.toThrow()
  })
})

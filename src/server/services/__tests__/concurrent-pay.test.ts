import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/prisma'
import { markInvoicePaid } from '@/server/services/invoices'
import { ApiError } from '@/lib/errors'

/**
 * Integration test for the payment row-lock. Requires a live DATABASE_URL
 * and creates throwaway data (cleaned up afterwards). Skips unless
 * NOVA_DB_TEST=1 — the default `npm test` run stays DB-free.
 *
 * Run with: NOVA_DB_TEST=1 npx vitest run src/server/services/__tests__/concurrent-pay.test.ts
 */
const runDbTests = process.env.NOVA_DB_TEST === '1'

describe('markInvoicePaid concurrency', () => {
  it.skipIf(!runDbTests)('allows exactly one concurrent full payment', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`

    const user = await prisma.user.create({
      data: {
        name: 'Concurrency Test',
        email: `conc-${suffix}@nova.test`,
        emailVerified: new Date(),
        passwordHash: 'x',
      },
      select: { id: true },
    })

    const ws = await prisma.workspace.create({
      data: {
        name: `Concurrency Test ${suffix}`,
        businessType: 'AGENCY',
        nextInvoiceNumber: 9000,
        members: { create: [{ userId: user.id, role: 'OWNER' }] },
      },
      select: { id: true },
    })

    try {
      const client = await prisma.client.create({
        data: { workspaceId: ws.id, name: 'Conc Client', company: 'Conc Co' },
        select: { id: true },
      })

      const invoice = await prisma.invoice.create({
        data: {
          workspaceId: ws.id,
          clientId: client.id,
          number: `TST-${suffix}`,
          status: 'DRAFT',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 86400_000),
          currency: 'USD',
          taxRate: 0,
          discount: 0,
          items: { create: [{ description: 'Work', quantity: 1, unitPrice: 1000 }] },
        },
        select: { id: true },
      })

      // Fire concurrent full payments: without the row lock all three would
      // observe a zero balance and overpay. With the lock exactly one wins.
      const results = await Promise.allSettled(
        Array.from({ length: 3 }).map(() =>
          markInvoicePaid(ws.id, invoice.id, { amount: 1000, method: 'CARD' }),
        ),
      )

      const ok = results.filter((r) => r.status === 'fulfilled')
      const failed = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      )

      expect(ok).toHaveLength(1)
      expect(failed).toHaveLength(2)
      for (const f of failed) {
        expect(f.reason).toBeInstanceOf(ApiError)
        const code = (f.reason as ApiError).code
        expect(['PAYMENT_EXCEEDS_BALANCE', 'INVALID_STATUS_TRANSITION']).toContain(code)
      }

      const [paymentCount, finalInvoice] = await Promise.all([
        prisma.payment.count({ where: { invoiceId: invoice.id } }),
        prisma.invoice.findUnique({ where: { id: invoice.id }, select: { status: true } }),
      ])
      expect(paymentCount).toBe(1)
      expect(finalInvoice?.status).toBe('PAID')
    } finally {
      await prisma.workspace.delete({ where: { id: ws.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
  })
})

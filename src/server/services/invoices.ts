import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/errors'
import { toCents, addCents, calcTaxCents, calcTotalCents } from '@/lib/money'
import type { Invoice, InvoiceItem, Prisma } from '@prisma/client'

export interface InvoiceLine {
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoiceTotals {
  subtotal: number // dollars, 2dp
  tax: number
  discount: number
  total: number
}

/**
 * Computes invoice totals in integer cents and returns dollar amounts.
 * This is the single source of truth for financial math.
 */
export function computeInvoiceTotals(
  items: { quantity: number; unitPrice: number }[],
  taxRate: number,
  discount: number,
): InvoiceTotals {
  const subtotalCents = addCents(...items.map((i) => toCents(i.quantity) * toCents(i.unitPrice) / 100))
  const taxCents = calcTaxCents(subtotalCents, taxRate)
  const discountCents = toCents(discount)
  const totalCents = calcTotalCents(subtotalCents, taxCents, discountCents)

  const divide = (c: number) => Math.round(c) / 100
  return {
    subtotal: divide(subtotalCents),
    tax: divide(taxCents),
    discount: divide(discountCents),
    total: divide(totalCents),
  }
}

/** Serializes Prisma invoice items into calculation-ready lines. */
export function itemsToLines(items: Pick<InvoiceItem, 'quantity' | 'unitPrice'>[]): InvoiceLine[] {
  return items.map((i) => ({
    description: '',
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
  }))
}

/**
 * Allocates the next unique invoice number for a workspace.
 * Uses an atomic counter on the workspace row so numbers can never collide,
 * even under concurrent requests.
 */
export async function nextInvoiceNumber(workspaceId: string): Promise<string> {
  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { nextInvoiceNumber: { increment: 1 } },
    select: { nextInvoiceNumber: true },
  })
  return `INV-${updated.nextInvoiceNumber}`
}

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[]
  payments: { id: string; amount: Prisma.Decimal; paidAt: Date }[]
  client?: { id: string; company: string; name: string; email: string | null } | null
}

export interface SerializedInvoice {
  id: string
  number: string
  status: Invoice['status']
  issueDate: string
  dueDate: string
  currency: string
  taxRate: number
  discount: number
  note: string | null
  sentAt: string | null
  paidAt: string | null
  createdAt: string
  clientId: string
  client?: { id: string; company: string; name: string; email: string | null } | null
  items: { id: string; description: string; quantity: number; unitPrice: number }[]
  subtotal: number
  tax: number
  total: number
  paid: number
  balance: number
  overdue: boolean
}

/** Converts a Prisma invoice (with items + payments) into an API-safe shape with computed totals. */
export function serializeInvoice(invoice: InvoiceWithItems): SerializedInvoice {
  const items = invoice.items.map((i) => ({
    id: i.id,
    description: i.description,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
  }))
  const totals = computeInvoiceTotals(itemsToLines(invoice.items), Number(invoice.taxRate), Number(invoice.discount))
  const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0)
  const balance = Math.max(0, totals.total - paid)
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    currency: invoice.currency,
    taxRate: Number(invoice.taxRate),
    discount: Number(invoice.discount),
    note: invoice.note,
    sentAt: invoice.sentAt?.toISOString() ?? null,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    clientId: invoice.clientId,
    client: invoice.client,
    items,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    paid,
    balance,
    overdue: invoice.status === 'OVERDUE',
  }
}

/** Loads an invoice scoped to the workspace or throws a not-found error. */
export async function getWorkspaceInvoiceOrThrow(
  workspaceId: string,
  invoiceId: string,
): Promise<InvoiceWithItems> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, workspaceId },
    include: { items: true, payments: { orderBy: { paidAt: 'asc' } } },
  })
  if (!invoice) throw new ApiError('NOT_FOUND', 'Invoice not found.', 404)
  return invoice
}

export type InvoiceStatus = Invoice['status']

const canTransition: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['PAID', 'CANCELLED', 'OVERDUE'],
  PAID: [],
  OVERDUE: ['PAID', 'CANCELLED'],
  CANCELLED: [],
}

export function assertTransition(from: InvoiceStatus, to: InvoiceStatus): void {
  if (from === to) return
  if (!canTransition[from].includes(to)) {
    throw new ApiError(
      'INVALID_STATUS_TRANSITION',
      `Cannot change an invoice from ${from} to ${to}.`,
      409,
    )
  }
}

export interface PaymentInput {
  amount: number
  method: 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'OTHER'
  paidAt?: Date
}

/**
 * Records a payment on an invoice and flips it to PAID.
 * Runs in a single transaction: validates ownership, inserts the payment,
 * stamps paidAt, records activity + notification.
 *
 * Concurrency safety: the invoice row is locked (SELECT ... FOR UPDATE)
 * before the remaining-balance check, so two concurrent payment requests
 * for the same invoice serialize — the loser sees the committed payment
 * (or the PAID status) and is rejected instead of overpaying.
 */
export async function markInvoicePaid(
  workspaceId: string,
  invoiceId: string,
  input: PaymentInput,
  tx: Prisma.TransactionClient = prisma,
): Promise<InvoiceWithItems> {
  // The row lock below is only meaningful inside a transaction. If the
  // caller did not provide one, open a transaction here so the function
  // is always safe to call.
  if (tx === prisma) {
    return prisma.$transaction((t) => markInvoicePaid(workspaceId, invoiceId, input, t))
  }

  // Serialize concurrent payment attempts on the same invoice. Any second
  // transaction blocks here until the first commits, then re-reads the
  // latest payments and status below.
  const [locked] = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Invoice"
    WHERE "id" = ${invoiceId} AND "workspaceId" = ${workspaceId}
    FOR UPDATE
  `
  if (!locked) throw new ApiError('NOT_FOUND', 'Invoice not found.', 404)

  const invoice = await tx.invoice.findFirst({
    where: { id: invoiceId, workspaceId },
    include: { items: true, payments: { orderBy: { paidAt: 'asc' } } },
  })
  if (!invoice) throw new ApiError('NOT_FOUND', 'Invoice not found.', 404)

  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
    throw new ApiError(
      'INVALID_STATUS_TRANSITION',
      `Cannot record a payment on a ${invoice.status.toLowerCase()} invoice.`,
      409,
    )
  }

  const paidSoFar = invoice.payments.reduce((s, p) => s + Number(p.amount), 0)
  const total = computeInvoiceTotals(
    itemsToLines(invoice.items),
    Number(invoice.taxRate),
    Number(invoice.discount),
  ).total

  if (input.amount > Math.max(0, total - paidSoFar) + 0.005) {
    throw new ApiError(
      'PAYMENT_EXCEEDS_BALANCE',
      'Payment amount exceeds the remaining balance.',
      400,
    )
  }

  const newPaid = paidSoFar + input.amount
  const fullyPaid = newPaid >= total - 0.005

  const updated = await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      status: fullyPaid ? 'PAID' : invoice.status === 'DRAFT' ? 'PENDING' : invoice.status,
      ...(fullyPaid ? { paidAt: new Date() } : {}),
      payments: {
        create: {
          workspaceId,
          amount: input.amount,
          method: input.method,
          paidAt: input.paidAt ?? new Date(),
        },
      },
    },
    include: { items: true, payments: { orderBy: { paidAt: 'asc' } } },
  })

  await tx.notification.create({
    data: {
      workspaceId,
      kind: fullyPaid ? 'INVOICE_PAID' : 'PAYMENT_RECEIVED',
      title: fullyPaid
        ? `Invoice ${updated.number} paid`
        : `Partial payment on ${updated.number}`,
      detail: `Payment of ${input.amount} recorded.`,
    },
  })
  await tx.activity.create({
    data: {
      workspaceId,
      kind: 'PAYMENT_RECEIVED',
      text: `Payment of ${input.amount} received on ${updated.number}`,
      detail: fullyPaid ? 'Invoice fully paid' : 'Partial payment',
      invoiceId: updated.id,
      clientId: updated.clientId,
    },
  })

  return updated
}

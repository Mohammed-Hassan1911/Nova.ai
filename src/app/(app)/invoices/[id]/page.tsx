'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Send,
  MoreHorizontal,
  PartyPopper,
  Trash2,
  Pencil,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dropdown } from '@/components/ui/Dropdown'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { fmt, fmtExact, formatDate, initialsOf } from '@/lib/utils'
import { invoiceStatusLabel } from '@/lib/labels'
import type { Invoice, InvoiceStatus, Payment, PaymentMethod } from '@/lib/types'

const transitions: Record<InvoiceStatus, { to: InvoiceStatus; label: string }[]> = {
  DRAFT: [
    { to: 'PENDING', label: 'Send invoice' },
    { to: 'CANCELLED', label: 'Void invoice' },
  ],
  PENDING: [
    { to: 'PAID', label: 'Mark as paid' },
    { to: 'OVERDUE', label: 'Mark overdue' },
    { to: 'CANCELLED', label: 'Void invoice' },
  ],
  OVERDUE: [
    { to: 'PAID', label: 'Mark as paid' },
    { to: 'CANCELLED', label: 'Void invoice' },
  ],
  PAID: [],
  CANCELLED: [],
}

const methods: { value: PaymentMethod; label: string }[] = [
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
]

export default function InvoiceDetailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [statusChange, setStatusChange] = useState<{ to: InvoiceStatus; label: string } | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    setError(false)
    Promise.all([
      api.get<{ invoice: Invoice }>(`/api/invoices/${id}`),
      api.get<{ payments: Payment[] }>(`/api/payments?invoiceId=${id}&per_page=50`),
    ])
      .then(([inv, p]) => {
        setInvoice(inv.invoice)
        setPayments(p.payments)
      })
      .catch((err) => {
        if (err instanceof Error && (err as { status?: number }).status === 404) setNotFound(true)
        else setError(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const downloadPdf = async () => {
    if (!invoice) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (!res.ok) throw new Error('bad response')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.number}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast({ kind: 'info', title: 'Downloading…', message: `${invoice.number}.pdf is ready.` })
    } catch {
      toast({ kind: 'warning', title: 'Could not generate PDF', message: 'Please try again.' })
    } finally {
      setDownloading(false)
    }
  }

  const sendInvoice = async () => {
    if (!invoice) return
    setSending(true)
    try {
      const data = await api.post<{ invoice: Invoice }>(`/api/invoices/${invoice.id}/send`)
      setInvoice(data.invoice)
      setSendOpen(false)
      toast({ kind: 'success', title: 'Invoice sent', message: `${data.invoice.number} marked as pending and emailed to ${data.invoice.client?.name ?? 'the client'}.` })
    } catch {
      toast({ kind: 'warning', title: 'Could not send invoice', message: 'Please try again.' })
    } finally {
      setSending(false)
    }
  }

  const applyStatus = async () => {
    if (!invoice || !statusChange) return
    setStatusLoading(true)
    try {
      const data = await api.patch<{ invoice: Invoice }>(`/api/invoices/${invoice.id}/status`, {
        status: statusChange.to,
      })
      setInvoice(data.invoice)
      setStatusChange(null)
      toast({ kind: 'success', title: `Invoice ${invoiceStatusLabel[statusChange.to].toLowerCase()}`, message: `${data.invoice.number} updated.` })
    } catch {
      toast({ kind: 'warning', title: 'Could not update status', message: 'Please try again.' })
    } finally {
      setStatusLoading(false)
    }
  }

  const deleteInvoice = async () => {
    if (!invoice) return
    setDeleting(true)
    try {
      await api.del(`/api/invoices/${invoice.id}`)
      toast({ kind: 'success', title: 'Invoice deleted', message: `${invoice.number} removed.` })
      router.push('/invoices')
    } catch {
      toast({ kind: 'warning', title: 'Could not delete invoice', message: 'Only draft invoices can be deleted.' })
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton className="h-4 w-24" />
        <div className="mt-6 flex items-start justify-between">
          <div>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-2 h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
          <div className="border-b border-line px-7 py-6 sm:px-10">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-6 w-44" />
          </div>
          <div className="px-7 py-5 sm:px-10">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || error || !invoice) {
    return (
      <div>
        <Link href="/invoices" className="group mb-5 flex w-fit items-center gap-1.5 rounded-[7px] px-2 py-1 text-[13px] text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg">
          <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
          Invoices
        </Link>
        <EmptyState
          icon={notFound ? MoreHorizontal : Download}
          title={notFound ? 'Invoice not found' : 'Could not load this invoice'}
          message={
            notFound
              ? 'This invoice no longer exists or you do not have access to it.'
              : 'Something went wrong while loading this invoice. Please try again.'
          }
          actionLabel="Back to invoices"
          onAction={() => router.push('/invoices')}
        />
      </div>
    )
  }

  const client = invoice.client
  const canRecordPayment = invoice.balance > 0 && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED'
  const nextTransitions = transitions[invoice.status] ?? []

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/invoices" className="group flex w-fit items-center gap-1.5 rounded-[7px] px-2 py-1 text-[13px] text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg">
          <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
          Invoices
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => void downloadPdf()} loading={downloading}>
            <Download size={14} />
            Download PDF
          </Button>
          {nextTransitions.some((t) => t.to === 'PENDING') && (
            <Button size="md" onClick={() => setSendOpen(true)}>
              <Send size={14} />
              Send invoice
            </Button>
          )}
          <Dropdown
            width={210}
            trigger={
              <Button variant="ghost" size="md" aria-label="More actions">
                <MoreHorizontal size={16} />
              </Button>
            }
          >
            {(close) => (
              <div className="p-1.5">
                {canRecordPayment && (
                  <button
                    onClick={() => { close(); setPayOpen(true) }}
                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg"
                  >
                    <Wallet size={15} />
                    Record payment
                  </button>
                )}
                {invoice.status === 'DRAFT' && (
                  <button
                    onClick={() => { close(); setEditOpen(true) }}
                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg"
                  >
                    <Pencil size={15} />
                    Edit invoice
                  </button>
                )}
                {nextTransitions.map((t) => (
                  <button
                    key={t.to}
                    onClick={() => { close(); setStatusChange(t) }}
                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg"
                  >
                    <CheckCircle2 size={15} />
                    {t.label}
                  </button>
                ))}
                {invoice.status === 'DRAFT' && (
                  <button
                    onClick={() => { close(); setDeleteOpen(true) }}
                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-danger transition-colors duration-150 hover:bg-danger/10"
                  >
                    <Trash2 size={15} />
                    Delete invoice
                  </button>
                )}
              </div>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-7 py-6 sm:px-10">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-gold">NOVA · Business Suite</p>
            <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-fg">{invoice.number}</h1>
            <p className="mt-1 text-[12.5px] text-fg-3">
              Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge status={invoiceStatusLabel[invoice.status]} />
            {invoice.overdue && (
              <span className="text-[12px] text-danger">Past due</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-b border-line px-7 py-6 sm:grid-cols-2 sm:px-10">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-fg-3">From</p>
            <p className="mt-2 text-[13.5px] font-medium text-fg">Your workspace</p>
            <p className="text-[12.5px] text-fg-2">Invoiced via NOVA</p>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-fg-3">Bill to</p>
            {client ? (
              <div className="mt-2 flex items-center gap-2.5">
                <Avatar initials={initialsOf(client.company)} size={28} />
                <div>
                  <p className="text-[13.5px] font-medium text-fg">{client.company}</p>
                  <p className="text-[12.5px] text-fg-2">{client.name}</p>
                  <p className="text-[12.5px] text-fg-2">{client.email}</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[12.5px] text-fg-3">Client removed</p>
            )}
          </div>
        </div>

        <div className="px-7 py-5 sm:px-10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line text-left text-[11.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">
                <th className="pb-2.5 pr-4">Description</th>
                <th className="pb-2.5 pr-4 text-right">Qty</th>
                <th className="pb-2.5 pr-4 text-right">Rate</th>
                <th className="pb-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((l) => (
                <tr key={l.id} className="border-b border-line/50 text-[13px]">
                  <td className="py-3 pr-4 text-fg">{l.description}</td>
                  <td className="py-3 pr-4 text-right tabular text-fg-2">{l.quantity}</td>
                  <td className="py-3 pr-4 text-right tabular text-fg-2">{fmtExact(l.unitPrice)}</td>
                  <td className="py-3 text-right font-medium tabular text-fg">
                    {fmtExact(l.quantity * l.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-[260px] space-y-1.5">
              <DocRow label="Subtotal" value={fmtExact(invoice.subtotal)} />
              <DocRow label={`Tax (${invoice.taxRate}%)`} value={fmtExact(invoice.tax)} />
              {invoice.discount > 0 && <DocRow label="Discount" value={`−${fmtExact(invoice.discount)}`} />}
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="text-[13px] font-semibold text-fg">Total</span>
                <span className="text-[17px] font-semibold tabular text-fg">{fmtExact(invoice.total)}</span>
              </div>
              <DocRow label="Paid" value={fmtExact(invoice.paid)} />
              <DocRow label="Balance" value={fmtExact(invoice.balance)} strong={invoice.balance > 0} />
            </div>
          </div>

          {invoice.note && (
            <p className="mt-6 border-t border-line pt-4 text-[12.5px] italic text-fg-3">{invoice.note}</p>
          )}
        </div>
      </div>

      {invoice.status === 'PAID' && (
        <div className="mx-auto mt-4 flex max-w-3xl items-center gap-3 rounded-[var(--radius-card)] border border-emerald/25 bg-emerald/8 px-5 py-3.5">
          <PartyPopper size={16} className="text-emerald" />
          <p className="text-[13px] text-fg">This invoice has been fully paid.</p>
        </div>
      )}

      {payments.length > 0 && (
        <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="text-[13.5px] font-semibold text-fg">Payment history</h2>
          </div>
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-[13px] last:border-b-0"
            >
              <span className="flex items-center gap-2 text-fg-2">
                <CheckCircle2 size={14} className="text-emerald" />
                {p.method.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                <span className="text-fg-3">· {formatDate(p.paidAt)}</span>
              </span>
              <span className="font-medium tabular text-emerald">+{fmtExact(p.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <SendModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        invoice={invoice}
        onConfirm={() => void sendInvoice()}
        loading={sending}
      />

      <PayModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        invoice={invoice}
        loading={paying}
        onConfirm={async (amount, method) => {
          setPaying(true)
          try {
            const data = await api.post<{ invoice: Invoice }>(`/api/invoices/${invoice.id}/pay`, {
              invoiceId: invoice.id,
              amount,
              method,
            })
            setInvoice(data.invoice)
            setPayOpen(false)
            toast({ kind: 'success', title: 'Payment recorded', message: `${fmtExact(amount)} received on ${data.invoice.number}.` })
            load()
          } catch {
            toast({ kind: 'warning', title: 'Could not record payment', message: 'Check the amount and try again.' })
          } finally {
            setPaying(false)
          }
        }}
      />

      <Modal
        open={!!statusChange}
        onClose={() => setStatusChange(null)}
        title={statusChange?.label ?? 'Update invoice'}
        description={`Move ${invoice.number} to "${statusChange ? invoiceStatusLabel[statusChange.to] : ''}".`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setStatusChange(null)}>
              Cancel
            </Button>
            <Button size="md" onClick={() => void applyStatus()} loading={statusLoading}>
              {statusLoading ? 'Updating…' : 'Confirm'}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-fg-2">
          {statusChange?.label} will update the invoice status and record this change in your activity feed.
        </p>
      </Modal>

      <EditInvoiceModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        invoice={invoice}
        onSaved={(updated) => {
          setInvoice(updated)
          setEditOpen(false)
          toast({ kind: 'success', title: 'Invoice updated', message: `${updated.number} saved.` })
        }}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete invoice"
        description={`This will permanently remove ${invoice.number}. This cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={() => void deleteInvoice()} loading={deleting}>
              {deleting ? 'Deleting…' : 'Delete invoice'}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-fg-2">
          Only draft invoices can be deleted. This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

function DocRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-fg-3">{label}</span>
      <span className={cn('tabular', strong ? 'font-semibold text-gold' : 'text-fg-2')}>{value}</span>
    </div>
  )
}

function SendModal({
  open,
  onClose,
  invoice,
  onConfirm,
  loading,
}: {
  open: boolean
  onClose: () => void
  invoice: Invoice
  onConfirm: () => void
  loading: boolean
}) {
  const client = invoice.client
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send invoice"
      description={`Send ${invoice.number} to ${client?.name ?? 'the client'} and mark it as pending.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={onConfirm} loading={loading}>
            <Send size={14} />
            Send invoice
          </Button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-fg-2">
        {client?.email
          ? `A copy will be emailed to ${client.email}.`
          : 'This client has no email on file, so the invoice will only be marked as pending.'}
      </p>
    </Modal>
  )
}

function PayModal({
  open,
  onClose,
  invoice,
  loading,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  invoice: Invoice
  loading: boolean
  onConfirm: (amount: number, method: PaymentMethod) => void
}) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('OTHER')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setAmount(invoice.balance > 0 ? String(invoice.balance) : '')
      setMethod('OTHER')
      setErrors({})
    }
  }, [open, invoice.balance])

  const submit = () => {
    const next: Record<string, string> = {}
    const value = Number(amount)
    if (!amount || Number.isNaN(value) || value <= 0) next.amount = 'Enter an amount greater than zero.'
    else if (value > invoice.balance + 0.005) next.amount = 'Amount exceeds the remaining balance.'
    setErrors(next)
    if (Object.keys(next).length) return
    onConfirm(value, method)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description={`Balance due on ${invoice.number}: ${fmtExact(invoice.balance)}`}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={submit} loading={loading}>
            {loading ? 'Recording…' : 'Record payment'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => { e.preventDefault(); submit() }}
        noValidate
        className="space-y-4"
      >
        <Input
          label="Amount (USD)"
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          autoFocus
        />
        <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          {methods.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  )
}

function EditInvoiceModal({
  open,
  onClose,
  invoice,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  invoice: Invoice
  onSaved: (invoice: Invoice) => void
}) {
  const { toast } = useToast()
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setDueDate(invoice.dueDate.slice(0, 10))
      setNote(invoice.note ?? '')
      setErrors({})
    }
  }, [open, invoice])

  const submit = async () => {
    const next: Record<string, string> = {}
    if (!dueDate) next.dueDate = 'Set a due date.'
    else if (invoice.issueDate && dueDate < invoice.issueDate.slice(0, 10)) next.dueDate = 'Due date must be after the issue date.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const data = await api.patch<{ invoice: Invoice }>(`/api/invoices/${invoice.id}`, {
        dueDate,
        note: note.trim() || null,
      })
      onSaved(data.invoice)
    } catch {
      toast({ kind: 'warning', title: 'Could not save changes', message: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit invoice"
      description={`${invoice.number} is a draft, so it can still be adjusted.`}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={() => void submit()} loading={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => { e.preventDefault(); void submit() }}
        noValidate
        className="space-y-4"
      >
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={errors.dueDate}
        />
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">Notes</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Payment terms, PO number…"
            className="min-h-[84px] w-full resize-y rounded-[var(--radius-input)] border border-line bg-surface px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
          />
        </label>
      </form>
    </Modal>
  )
}

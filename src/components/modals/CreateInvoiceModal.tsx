'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { fmt, fmtExact, clientLabel } from '@/lib/utils'
import type { Client, Invoice } from '@/lib/types'

const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

interface Line {
  description: string
  quantity: string
  unitPrice: string
}

const emptyLine: Line = { description: '', quantity: '1', unitPrice: '' }

export function CreateInvoiceModal({
  open,
  onClose,
  presetClientId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  presetClientId?: string | null
  onCreated?: (invoice: Invoice) => void
}) {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState(plusDays(30))
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setClientId('')
    setIssueDate(today())
    setDueDate(plusDays(30))
    setNote('')
    setLines([{ ...emptyLine }])
    setErrors({})
    const load = () => {
      if (clients.length > 0) {
        const fallback = presetClientId && clients.some((c) => c.id === presetClientId)
          ? presetClientId
          : clients[0]?.id ?? ''
        setClientId(fallback)
        return
      }
      api
        .get<{ clients: Client[] }>('/api/clients?per_page=50')
        .then((data) => {
          setClients(data.clients)
          const fallback = presetClientId && data.clients.some((c) => c.id === presetClientId)
            ? presetClientId
            : data.clients[0]?.id ?? ''
          setClientId(fallback)
        })
        .catch(() => setClients([]))
    }
    load()
  }, [open, presetClientId, clients.length])

  const total = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    0,
  )

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const removeLine = (i: number) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }])

  const submit = async () => {
    const next: Record<string, string> = {}
    if (!clientId) next.clientId = 'Select a client.'
    if (!issueDate) next.issueDate = 'Set an issue date.'
    if (!dueDate) next.dueDate = 'Set a due date.'
    if (dueDate && issueDate && dueDate < issueDate) next.dueDate = 'Due date must be after the issue date.'
    const items: { description: string; quantity: number; unitPrice: number }[] = []
    lines.forEach((l, i) => {
      const desc = l.description.trim()
      const qty = Number(l.quantity)
      const price = Number(l.unitPrice)
      if (!desc || !qty || qty <= 0 || price === null || price === undefined || Number.isNaN(price) || price < 0) {
        next[`line-${i}`] = 'Fill in a description, quantity and price.'
      } else {
        items.push({ description: desc, quantity: qty, unitPrice: price })
      }
    })
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const data = await api.post<{ invoice: Invoice }>('/api/invoices', {
        clientId,
        issueDate,
        dueDate,
        note: note.trim() || null,
        items,
      })
      onCreated?.(data.invoice)
      toast({
        kind: 'success',
        title: 'Invoice created',
        message: `${data.invoice.number} drafted for ${fmtExact(data.invoice.total)}.`,
      })
      onClose()
    } catch (err) {
      toast({ kind: 'warning', title: 'Could not create invoice', message: 'Please check the details and try again.' })
    } finally {
      setLoading(false)
    }
  }

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New invoice"
      description="Build an invoice with line items."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={() => void submit()} loading={loading}>
            {loading ? 'Creating…' : 'Create invoice'}
          </Button>
        </>
      }
    >
      <form onSubmit={onFormSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)} error={errors.clientId}>
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {clientLabel(c)}
              </option>
            ))}
          </Select>
          <DatePicker
            label="Issue date"
            value={issueDate}
            onChange={setIssueDate}
            error={errors.issueDate}
          />
          <DatePicker
            label="Due date"
            value={dueDate}
            onChange={setDueDate}
            error={errors.dueDate}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">Line items</span>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    placeholder="Description"
                    value={l.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    className="h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface px-3.5 text-[13.5px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-violet/50 focus:shadow-[var(--shadow-focus)]"
                  />
                </div>
                <div className="w-20">
                  <input
                    placeholder="Qty"
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                    className="h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface px-3 text-center text-[13.5px] tabular text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-violet/50 focus:shadow-[var(--shadow-focus)]"
                  />
                </div>
                <div className="w-24">
                  <input
                    placeholder="Price"
                    type="number"
                    min={0}
                    value={l.unitPrice}
                    onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
                    className="h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface px-3 text-right text-[13.5px] tabular text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-violet/50 focus:shadow-[var(--shadow-focus)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-fg-3 transition-colors duration-150 hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                  aria-label="Remove line"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(() => {
              const msg = lines.map((_, i) => errors[`line-${i}`]).find(Boolean)
              return msg ? (
                <span className="block text-[12.5px] text-danger">{msg}</span>
              ) : null
            })()}
          </div>
          <button
            type="button"
            onClick={addLine}
            className="mt-2.5 flex items-center gap-1.5 text-[12.5px] font-medium text-violet transition-colors duration-150 hover:text-violet-bright"
          >
            <Plus size={13} />
            Add line item
          </button>
        </div>

        <Input label="Notes" placeholder="Payment terms, PO number…" value={note} onChange={(e) => setNote(e.target.value)} />

        <div className="flex items-center justify-between rounded-[var(--radius-input)] border border-line bg-surface-2 px-4 py-3">
          <span className="text-[13px] text-fg-3">Total</span>
          <span className="text-[18px] font-semibold tabular text-fg">{fmt(total)}</span>
        </div>
      </form>
    </Modal>
  )
}

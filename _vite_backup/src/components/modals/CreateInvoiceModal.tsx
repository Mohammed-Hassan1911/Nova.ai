import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAppState } from '@/store/AppState'
import { useToast } from '@/components/ui/Toast'
import { fmt } from '@/lib/utils'
import type { InvoiceLine } from '@/data/mock'

const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

interface Line {
  description: string
  quantity: string
  rate: string
}

const emptyLine: Line = { description: '', quantity: '1', rate: '' }

export function CreateInvoiceModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { clients, createInvoice, navigate } = useAppState()
  const { toast } = useToast()
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState(plusDays(14))
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const total = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.rate) || 0),
    0,
  )

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const removeLine = (i: number) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!clientId) next.clientId = 'Select a client.'
    if (!issueDate) next.issueDate = 'Set an issue date.'
    if (!dueDate) next.dueDate = 'Set a due date.'
    const validLines: InvoiceLine[] = []
    lines.forEach((l, i) => {
      const desc = l.description.trim()
      const qty = Number(l.quantity)
      const rate = Number(l.rate)
      if (!desc || !qty || !rate) {
        next[`line-${i}`] = 'Fill in description, quantity and rate.'
      } else {
        validLines.push({ description: desc, quantity: qty, rate })
      }
    })
    setErrors(next)
    if (Object.keys(next).length) return

    createInvoice({
      clientId,
      issueDate,
      dueDate,
      items: validLines,
    })
    toast({
      kind: 'success',
      title: 'Invoice created',
      message: `Drafted for ${fmt(total)} and added to your queue.`,
    })
    setClientId(clients[0]?.id ?? '')
    setIssueDate(today())
    setDueDate(plusDays(14))
    setLines([{ ...emptyLine }])
    setErrors({})
    onClose()
    navigate({ view: 'invoices' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New invoice"
      description="Build an invoice with line items."
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              error={errors.clientId}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Issue date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            error={errors.issueDate}
          />
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            error={errors.dueDate}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">
            Line items
          </span>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    placeholder="Description"
                    value={l.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    className="h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface px-3.5 text-[13.5px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
                  />
                </div>
                <div className="w-20">
                  <input
                    placeholder="Qty"
                    type="number"
                    value={l.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                    className="h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface px-3 text-center text-[13.5px] tabular text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
                  />
                </div>
                <div className="w-24">
                  <input
                    placeholder="Rate"
                    type="number"
                    value={l.rate}
                    onChange={(e) => updateLine(i, { rate: e.target.value })}
                    className="h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface px-3 text-right text-[13.5px] tabular text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-fg-3 transition-colors duration-150 hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {errors['line-0'] && (
              <span className="block text-[12.5px] text-danger">{errors['line-0']}</span>
            )}
          </div>
          <button
            type="button"
            onClick={addLine}
            className="mt-2.5 flex items-center gap-1.5 text-[12.5px] font-medium text-gold transition-colors duration-150 hover:text-gold-bright"
          >
            <Plus size={13} />
            Add line item
          </button>
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-input)] border border-line bg-surface-2 px-4 py-3">
          <span className="text-[13px] text-fg-3">Total</span>
          <span className="text-[18px] font-semibold tabular text-fg">{fmt(total)}</span>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create invoice</Button>
        </div>
      </form>
    </Modal>
  )
}

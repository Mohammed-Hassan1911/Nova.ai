import { ArrowLeft, CheckCircle2, Download, Send, Printer, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppState } from '@/store/AppState'
import { useToast } from '@/components/ui/Toast'
import { fmt, formatDate } from '@/lib/utils'
import { fmtExact } from '@/data/mock'

export function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const { invoices, clientById, navigate, markInvoicePaid } = useAppState()
  const { toast } = useToast()

  const invoice = invoices.find((i) => i.id === invoiceId)

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-[14px] text-fg-2">This invoice could not be found.</p>
        <button
          onClick={() => navigate({ view: 'invoices' })}
          className="mt-3 text-[13px] text-gold hover:text-gold-bright"
        >
          ← Back to invoices
        </button>
      </div>
    )
  }

  const client = clientById(invoice.clientId)
  const subtotal = invoice.items.reduce((s, l) => s + l.quantity * l.rate, 0)
  const tax = Math.round(subtotal * 0.08)
  const total = subtotal + tax
  const isPaid = invoice.status === 'Paid'

  const handlePaid = () => {
    markInvoicePaid(invoice.id)
    toast({
      kind: 'success',
      title: 'Invoice marked as paid',
      message: `${invoice.id} · ${fmt(invoice.amount)} received.`,
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate({ view: 'invoices' })}
          className="group flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-[13px] text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg"
        >
          <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
          Invoices
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              toast({ kind: 'info', title: 'Downloading…', message: `${invoice.id}.pdf is being generated.` })
            }
          >
            <Download size={14} />
            Download PDF
          </Button>
          {!isPaid && (
            <Button variant="primary" size="md" onClick={handlePaid}>
              <CheckCircle2 size={14} />
              Mark as paid
            </Button>
          )}
        </div>
      </div>

      {/* document */}
      <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface shadow-[var(--shadow-card)]">
        {/* doc header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-7 py-6 sm:px-10">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-gold">
              NOVA · Hassan Studio
            </p>
            <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-fg">
              {invoice.id}
            </h1>
            <p className="mt-1 text-[12.5px] text-fg-3">
              Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status} />
            {invoice.daysOverdue ? (
              <span className="text-[12px] text-danger">{invoice.daysOverdue} days overdue</span>
            ) : null}
          </div>
        </div>

        {/* parties */}
        <div className="grid grid-cols-1 gap-6 border-b border-line px-7 py-6 sm:grid-cols-2 sm:px-10">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-fg-3">From</p>
            <p className="mt-2 text-[13.5px] font-medium text-fg">Mohammed Hassan</p>
            <p className="text-[12.5px] text-fg-2">Hassan Studio · mohammed@novaworks.io</p>
            <p className="text-[12.5px] text-fg-2">Remote · Worldwide</p>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-fg-3">Bill to</p>
            {client && (
              <div className="mt-2 flex items-center gap-2.5">
                <Avatar initials={client.initials} size={28} />
                <div>
                  <p className="text-[13.5px] font-medium text-fg">{client.company}</p>
                  <p className="text-[12.5px] text-fg-2">{client.name}</p>
                  <p className="text-[12.5px] text-fg-2">{client.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* line items */}
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
              {invoice.items.map((l, i) => (
                <tr key={i} className="border-b border-line/50 text-[13px]">
                  <td className="py-3 pr-4 text-fg">{l.description}</td>
                  <td className="py-3 pr-4 text-right tabular text-fg-2">{l.quantity}</td>
                  <td className="py-3 pr-4 text-right tabular text-fg-2">{fmtExact(l.rate)}</td>
                  <td className="py-3 text-right font-medium tabular text-fg">
                    {fmtExact(l.quantity * l.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-[260px] space-y-1.5">
              <Row label="Subtotal" value={fmtExact(subtotal)} />
              <Row label="Tax (8%)" value={fmtExact(tax)} />
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="text-[13px] font-semibold text-fg">Total due</span>
                <span className="text-[17px] font-semibold tabular text-fg">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {invoice.note && (
            <p className="mt-6 border-t border-line pt-4 text-[12.5px] italic text-fg-3">
              {invoice.note}
            </p>
          )}
        </div>
      </div>

      {/* paid banner */}
      {isPaid && (
        <div className="mx-auto mt-4 flex max-w-3xl items-center gap-3 rounded-[var(--radius-card)] border border-emerald/25 bg-emerald/8 px-5 py-3.5">
          <PartyPopper size={16} className="text-emerald" />
          <p className="text-[13px] text-fg">
            This invoice has been paid.
          </p>
        </div>
      )}

      <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => client && navigate({ view: 'client', id: client.id })}
          className={cn(
            'text-[13px] text-fg-3 transition-colors duration-150',
            client ? 'hover:text-gold' : 'pointer-events-none',
          )}
        >
          View {client?.company ?? 'client'} →
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toast({ kind: 'info', title: 'Reminder queued', message: `A payment reminder will be sent to ${client?.name}.` })
            }
          >
            <Send size={14} />
            Remind
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toast({ kind: 'info', title: 'Printing…', message: `${invoice.id} sent to the print dialog.` })
            }
          >
            <Printer size={14} />
            Print
          </Button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-fg-3">{label}</span>
      <span className="tabular text-fg-2">{value}</span>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, FileText, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { CreateInvoiceModal } from '@/components/modals/CreateInvoiceModal'
import { useAppState } from '@/store/AppState'
import { fmt, formatDate } from '@/lib/utils'
import type { InvoiceStatus } from '@/data/mock'

const filters: (InvoiceStatus | 'All')[] = ['All', 'Pending', 'Paid', 'Overdue']

export function Invoices() {
  const { invoices, clientById, navigate } = useAppState()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(t)
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((i) => {
      if (filter !== 'All' && i.status !== filter) return false
      if (!q) return true
      const client = clientById(i.clientId)
      return (
        i.id.toLowerCase().includes(q) ||
        (client?.company.toLowerCase().includes(q) ?? false)
      )
    })
  }, [invoices, query, filter, clientById])

  const summary = useMemo(() => {
    const pending = invoices.filter((i) => i.status === 'Pending').reduce((s, i) => s + i.amount, 0)
    const overdue = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0)
    return { pending, overdue, outstanding: pending + overdue }
  }, [invoices])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">
            Invoices
          </h1>
          <p className="mt-1 text-[13.5px] text-fg-3">
            {fmt(summary.overdue)} overdue · {fmt(summary.pending)} pending
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} strokeWidth={2.2} />
          New invoice
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1 sm:max-w-[280px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices…"
            className="h-9.5 w-full rounded-[var(--radius-input)] border border-line bg-surface pl-9 pr-3 text-[13.5px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
          />
        </div>
        <div className="flex flex-wrap rounded-[8px] border border-line bg-surface-2 p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-150',
                filter === f ? 'bg-raised text-fg shadow-sm' : 'text-fg-3 hover:text-fg-2',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b border-line px-5 py-4 last:border-b-0">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={query ? 'No invoices found' : 'No invoices yet'}
            message={
              query
                ? `Nothing matches "${query}". Try a different search.`
                : 'Create your first invoice to start billing clients.'
            }
            actionLabel={query ? undefined : 'New invoice'}
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
            <div className="hidden grid-cols-[1.1fr_1.4fr_1fr_1fr_0.8fr_0.5fr] items-center gap-4 border-b border-line bg-surface-2 px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-fg-3 sm:grid">
              <span>Invoice</span>
              <span>Client</span>
              <span>Issued</span>
              <span className="text-right">Amount</span>
              <span>Status</span>
              <span />
            </div>
            {visible.map((inv, i) => {
              const client = clientById(inv.clientId)
              return (
                <motion.button
                  key={inv.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.03 * i, 0.2), duration: 0.2 }}
                  onClick={() => navigate({ view: 'invoice', id: inv.id })}
                  className="group grid w-full grid-cols-2 items-center gap-2 border-b border-line px-5 py-4 text-left transition-colors duration-150 last:border-b-0 hover:bg-hover sm:grid-cols-[1.1fr_1.4fr_1fr_1fr_0.8fr_0.5fr] sm:gap-4"
                >
                  <span className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
                    {inv.id}
                    {inv.daysOverdue ? (
                      <span className="rounded-full bg-danger/12 px-1.5 py-0.5 text-[10.5px] font-medium text-danger">
                        {inv.daysOverdue}d late
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate text-[13px] text-fg-2">
                    {client?.company ?? 'Unknown client'}
                  </span>
                  <span className="text-[12.5px] tabular text-fg-3 sm:block">
                    {formatDate(inv.issueDate)}
                  </span>
                  <span className="text-right text-[13.5px] font-medium tabular text-fg sm:text-right">
                    {fmt(inv.amount)}
                  </span>
                  <span className="justify-self-start">
                    <StatusBadge status={inv.status} />
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="hidden text-fg-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:block"
                  />
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

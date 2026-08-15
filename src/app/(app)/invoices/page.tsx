'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus, Search, FileText, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { CreateInvoiceModal } from '@/components/modals/CreateInvoiceModal'
import { api, queryString } from '@/lib/client'
import { fmt, formatDate } from '@/lib/utils'
import { invoiceStatusLabel } from '@/lib/labels'
import type { Invoice, InvoiceStatus } from '@/lib/types'

const filters: (InvoiceStatus | 'All')[] = ['All', 'DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']

export default function InvoicesPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState<InvoiceStatus | 'All'>('All')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [presetClientId, setPresetClientId] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 250)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api
      .get<{ invoices: Invoice[] }>(
        `/api/invoices${queryString({
          q: debouncedQuery,
          status: filter === 'All' ? undefined : filter,
          per_page: 50,
        })}`,
        { signal: controller.signal },
      )
      .then((data) => setInvoices(data.invoices))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setInvoices([])
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [debouncedQuery, filter])

  useEffect(() => {
    const create = new URLSearchParams(window.location.search).get('create')
    if (create) {
      setPresetClientId(create)
      setCreateOpen(true)
      window.history.replaceState({}, '', '/invoices')
    }
  }, [])

  const summary = useMemo(() => {
    const pending = invoices.filter((i) => i.status === 'PENDING').reduce((s, i) => s + i.total, 0)
    const overdue = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.total, 0)
    return { pending, overdue }
  }, [invoices])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">Invoices</h1>
          <p className="mt-1 text-[13.5px] text-fg-3">
            {fmt(summary.overdue)} overdue · {fmt(summary.pending)} pending
          </p>
        </div>
        <Button onClick={() => { setPresetClientId(null); setCreateOpen(true) }}>
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
              {f === 'All' ? 'All' : invoiceStatusLabel[f]}
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
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={debouncedQuery || filter !== 'All' ? 'No invoices found' : 'No invoices yet'}
            message={
              debouncedQuery || filter !== 'All'
                ? 'Nothing matches your filters. Try a different search.'
                : 'Create your first invoice to start billing clients.'
            }
            actionLabel={!debouncedQuery && filter === 'All' ? 'New invoice' : undefined}
            onAction={!debouncedQuery && filter === 'All' ? () => { setPresetClientId(null); setCreateOpen(true) } : undefined}
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
            {invoices.map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.03 * i, 0.2), duration: 0.2 }}
              >
                <Link
                  href={`/invoices/${inv.id}`}
                  className="group grid w-full grid-cols-2 items-center gap-2 border-b border-line px-5 py-4 text-left transition-colors duration-150 last:border-b-0 hover:bg-hover sm:grid-cols-[1.1fr_1.4fr_1fr_1fr_0.8fr_0.5fr] sm:gap-4"
                >
                  <span className="flex items-center gap-2 text-[13.5px] font-medium text-fg">{inv.number}</span>
                  <span className="truncate text-[13px] text-fg-2">
                    {inv.client?.company ?? 'Unknown client'}
                  </span>
                  <span className="text-[12.5px] tabular text-fg-3">{formatDate(inv.issueDate)}</span>
                  <span className="text-right text-[13.5px] font-medium tabular text-fg">{fmt(inv.total)}</span>
                  <span className="justify-self-start">
                    <StatusBadge status={invoiceStatusLabel[inv.status]} />
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="hidden text-fg-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:block"
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateInvoiceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        presetClientId={presetClientId}
      />
    </div>
  )
}

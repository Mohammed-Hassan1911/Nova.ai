'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, Users, ArrowUpRight, RefreshCw, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PaginationBar } from '@/components/ui/Pagination'
import { api, queryString } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { initialsOf } from '@/lib/utils'
import { clientStatusLabel } from '@/lib/labels'
import type { Client } from '@/lib/types'

const PER_PAGE = 50

type Filter = 'All' | 'ACTIVE' | 'PROSPECT' | 'INACTIVE'
const filters: Filter[] = ['All', 'ACTIVE', 'PROSPECT', 'INACTIVE']

export function ClientsView({
  initialClients,
  initialTotal,
}: {
  initialClients: Client[]
  initialTotal: number
}) {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(Math.max(1, Math.ceil(initialTotal / PER_PAGE)))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 250)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, filter])

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get<{ clients: Client[]; pagination: { total: number; pages: number } }>(
        `/api/clients${queryString({
          q: debouncedQuery,
          status: filter === 'All' ? undefined : filter,
          page,
          per_page: PER_PAGE,
        })}`,
        { signal: controller.signal },
      )
      .then((data) => {
        setClients(data.clients)
        setTotal(data.pagination.total)
        setPages(Math.max(1, data.pagination.pages))
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error && err.message ? err.message : 'Something went wrong loading your clients.')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [debouncedQuery, filter, page, reloadKey])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { All: total, ACTIVE: 0, PROSPECT: 0, INACTIVE: 0 }
    clients.forEach((cl) => c[cl.status as Filter]++)
    return c
  }, [clients, total])

  const onCreated = useCallback((client: Client) => {
    setAddOpen(false)
    toast({ kind: 'success', title: 'Client created', message: `${client.company} added to your workspace.` })
    setClients((prev) => [client, ...prev])
  }, [toast])

  const retry = useCallback(() => {
    setReloadKey((k) => k + 1)
  }, [])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">Clients</h1>
          <p className="mt-1 text-[13.5px] text-fg-3">
            Manage relationships and keep every engagement organized.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} strokeWidth={2.2} />
          Add client
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1 sm:max-w-[280px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            className="h-9.5 w-full rounded-[var(--radius-input)] border border-line bg-surface pl-9 pr-3 text-[13.5px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
          />
        </div>
        <div className="flex rounded-[8px] border border-line bg-surface-2 p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-150',
                filter === f ? 'bg-raised text-fg shadow-sm' : 'text-fg-3 hover:text-fg-2',
              )}
            >
              {f === 'All' ? 'All' : clientStatusLabel[f]}
              <span className="ml-1.5 text-[11px] tabular text-fg-3">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && clients.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3">
          <p className="flex min-w-0 items-center gap-2 text-[13px] text-fg-2">
            <WifiOff size={14} className="shrink-0 text-fg-3" />
            <span className="truncate">{error}</span>
          </p>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      <div className="mt-5 hidden overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface md:block">
        <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.9fr_0.8fr_0.6fr] items-center gap-4 border-b border-line px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">
          <span>Name</span>
          <span>Company</span>
          <span>Projects</span>
          <span>Invoices</span>
          <span>Status</span>
          <span />
        </div>
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-3 py-3">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : error && clients.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={WifiOff}
              title="Couldn't load clients"
              message={error}
              actionLabel="Retry"
              onAction={retry}
            />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={debouncedQuery || filter !== 'All' ? Search : Users}
              title={debouncedQuery || filter !== 'All' ? 'No clients found' : 'No clients yet'}
              message={
                debouncedQuery || filter !== 'All'
                  ? 'Nothing matches your filters. Try a different search.'
                  : 'Add your first client to start tracking engagements.'
              }
              actionLabel={!debouncedQuery && filter === 'All' ? 'Add client' : undefined}
              onAction={!debouncedQuery && filter === 'All' ? () => setAddOpen(true) : undefined}
            />
          </div>
        ) : (
          <div>
            {clients.map((c, i) => (
              <a
                key={c.id}
                href={`/clients/${c.id}`}
                className="group grid w-full grid-cols-[2fr_1.2fr_0.8fr_0.9fr_0.8fr_0.6fr] items-center gap-4 border-b border-line px-5 py-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-hover"
              >
                <span className="flex items-center gap-3">
                  <Avatar initials={initialsOf(c.name)} size={34} />
                  <span>
                    <span className="block text-[13.5px] font-medium text-fg group-hover:text-white">{c.name}</span>
                    <span className="block text-[11.5px] text-fg-3">{c.email}</span>
                  </span>
                </span>
                <span className="text-[13.5px] text-fg-2">{c.company}</span>
                <span className="text-[13.5px] tabular text-fg-2">{c._count?.projects ?? 0}</span>
                <span className="text-[13.5px] tabular text-fg-2">{c._count?.invoices ?? 0}</span>
                <span>
                  <StatusBadge status={clientStatusLabel[c.status]} />
                </span>
                <span className="flex justify-end">
                  <ArrowUpRight
                    size={14}
                    className="text-fg-3 opacity-0 transition-opacity duration-150 group-hover:text-gold group-hover:opacity-100"
                  />
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {clients.map((c) => (
          <a
            key={c.id}
            href={`/clients/${c.id}`}
            className="block w-full rounded-[var(--radius-card)] border border-line bg-surface p-4 text-left transition-colors duration-150 hover:border-line-strong"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar initials={initialsOf(c.name)} size={36} />
                <div>
                  <p className="text-[14px] font-medium text-fg">{c.company}</p>
                  <p className="text-[12px] text-fg-3">{c.name}</p>
                </div>
              </div>
              <StatusBadge status={clientStatusLabel[c.status]} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <div>
                <p className="text-[11px] text-fg-3">Projects</p>
                <p className="text-[14px] font-semibold tabular text-fg">{c._count?.projects ?? 0}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-fg-3">Invoices</p>
                <p className="text-[14px] font-semibold tabular text-fg">{c._count?.invoices ?? 0}</p>
              </div>
            </div>
          </a>
        ))}
        {clients.length === 0 && !loading && !error && (
          <EmptyState
            icon={Users}
            title="No clients found"
            message="Adjust your filters or add a new client."
          />
        )}
      </div>

      <PaginationBar
        page={page}
        pages={pages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pages, p + 1))}
        disabled={loading}
      />

      <ClientModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={onCreated} />
    </div>
  )
}

export function ClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (client: Client) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'PROSPECT' | 'INACTIVE'>('ACTIVE')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setCompany('')
      setEmail('')
      setPhone('')
      setStatus('ACTIVE')
      setNotes('')
      setErrors({})
    }
  }, [open])

  const submit = async () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Name is required.'
    if (!company.trim()) next.company = 'Company is required.'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const data = await api.post<{ client: Client }>('/api/clients', {
        name: name.trim(),
        company: company.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        status,
        notes: notes.trim() || null,
      })
      onCreated?.(data.client)
    } catch (err) {
      toast({ kind: 'warning', title: 'Could not create client', message: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submit()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add client"
      description="A client can have projects and invoices."
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={() => void submit()} loading={loading}>
            {loading ? 'Saving…' : 'Add client'}
          </Button>
        </>
      }
    >
      <form onSubmit={onFormSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Contact name" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Input label="Company" placeholder="Acme Inc." value={company} onChange={(e) => setCompany(e.target.value)} error={errors.company} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" placeholder="jane@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Input label="Phone" placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="ACTIVE">Active</option>
          <option value="PROSPECT">Prospect</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering…"
            className="min-h-[84px] w-full resize-y rounded-[var(--radius-input)] border border-line bg-surface px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
          />
        </label>
      </form>
    </Modal>
  )
}

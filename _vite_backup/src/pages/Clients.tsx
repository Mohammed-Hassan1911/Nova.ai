import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Users, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddClientModal } from '@/components/modals/AddClientModal'
import { useAppState } from '@/store/AppState'
import { fmt } from '@/lib/utils'
import { projects } from '@/data/mock'
import type { ClientStatus } from '@/data/mock'

type Filter = 'All' | ClientStatus

const filters: Filter[] = ['All', 'Active', 'Prospect', 'Inactive']

export function Clients() {
  const { clients, navigate } = useAppState()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [addOpen, setAddOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(t)
  }, [])

  const projectCount = (clientId: string) =>
    projects.filter((p) => p.clientId === clientId && p.status !== 'Completed').length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients.filter((c) => {
      if (filter !== 'All' && c.status !== filter) return false
      if (!q) return true
      return (
        c.company.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      )
    })
  }, [clients, query, filter])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { All: clients.length, Active: 0, Prospect: 0, Inactive: 0 }
    clients.forEach((cl) => c[cl.status]++)
    return c
  }, [clients])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">
            Clients
          </h1>
          <p className="mt-1 text-[13.5px] text-fg-3">
            Manage relationships and keep every engagement organized.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} strokeWidth={2.2} />
          Add client
        </Button>
      </div>

      {/* search + filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1 sm:max-w-[280px]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3"
          />
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
              {f}
              <span className="ml-1.5 text-[11px] tabular text-fg-3">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="mt-5 hidden overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface md:block">
        <div className="grid grid-cols-[2fr_1.1fr_0.9fr_1fr_0.8fr_1fr] items-center gap-4 border-b border-line px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">
          <span>Name</span>
          <span>Company</span>
          <span>Projects</span>
          <span>Revenue</span>
          <span>Status</span>
          <span>Last activity</span>
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
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Search}
              title={query ? 'No clients found' : 'No clients yet'}
              message={
                query
                  ? `Nothing matches "${query}". Try a different search.`
                  : 'Add your first client to start tracking engagements.'
              }
            />
          </div>
        ) : (
          <div>
            {visible.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.03 * i, duration: 0.2 }}
                onClick={() => navigate({ view: 'client', id: c.id })}
                className="group grid w-full grid-cols-[2fr_1.1fr_0.9fr_1fr_0.8fr_1fr] items-center gap-4 border-b border-line px-5 py-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-hover"
              >
                <span className="flex items-center gap-3">
                  <Avatar initials={c.initials} size={34} />
                  <span>
                    <span className="block text-[13.5px] font-medium text-fg group-hover:text-white">
                      {c.name}
                    </span>
                    <span className="block text-[11.5px] text-fg-3">{c.email}</span>
                  </span>
                </span>
                <span className="text-[13.5px] text-fg-2">{c.company}</span>
                <span className="text-[13.5px] tabular text-fg-2">
                  {projectCount(c.id)}
                </span>
                <span className="text-[13.5px] font-medium tabular text-fg">
                  {c.revenue > 0 ? fmt(c.revenue) : '—'}
                </span>
                <span>
                  <StatusBadge status={c.status} />
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] text-fg-3">{c.lastActivity}</span>
                  <ArrowUpRight
                    size={14}
                    className="text-fg-3 opacity-0 transition-opacity duration-150 group-hover:text-gold group-hover:opacity-100"
                  />
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Cards (mobile) */}
      <div className="mt-4 space-y-3 md:hidden">
        {visible.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate({ view: 'client', id: c.id })}
            className="w-full rounded-[var(--radius-card)] border border-line bg-surface p-4 text-left transition-colors duration-150 hover:border-line-strong"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar initials={c.initials} size={36} />
                <div>
                  <p className="text-[14px] font-medium text-fg">{c.company}</p>
                  <p className="text-[12px] text-fg-3">{c.name}</p>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <div>
                <p className="text-[11px] text-fg-3">Revenue</p>
                <p className="text-[14px] font-semibold tabular text-fg">
                  {c.revenue > 0 ? fmt(c.revenue) : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-fg-3">Projects</p>
                <p className="text-[14px] font-semibold tabular text-fg">
                  {projectCount(c.id)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-fg-3">Last activity</p>
                <p className="text-[13px] text-fg-2">{c.lastActivity}</p>
              </div>
            </div>
          </button>
        ))}
        {visible.length === 0 && !loading && (
          <EmptyState
            icon={Users}
            title="No clients found"
            message="Adjust your filters or add a new client."
          />
        )}
      </div>

      <AddClientModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, FolderKanban, CalendarDays, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddProjectModal } from '@/components/modals/AddProjectModal'
import { useAppState } from '@/store/AppState'
import { fmt, formatDate } from '@/lib/utils'
import type { ProjectStatus } from '@/data/mock'

const filters: (ProjectStatus | 'All')[] = ['All', 'On track', 'At risk', 'Behind', 'Completed']

export function Projects() {
  const { projects, navigate, clientById } = useAppState()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [addOpen, setAddOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(t)
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      if (filter !== 'All' && p.status !== filter) return false
      if (!q) return true
      const client = clientById(p.clientId)
      return (
        p.name.toLowerCase().includes(q) ||
        (client?.company.toLowerCase().includes(q) ?? false)
      )
    })
  }, [projects, query, filter, clientById])

  const budgetUtil = (spent: number, budget: number) =>
    budget > 0 ? Math.round((spent / budget) * 100) : 0

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">
            Projects
          </h1>
          <p className="mt-1 text-[13.5px] text-fg-3">
            Track progress, budgets, and delivery across every engagement.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} strokeWidth={2.2} />
          New project
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1 sm:max-w-[280px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-3 w-24" />
                <Skeleton className="mt-4 h-1.5 w-full" />
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={query ? 'No projects found' : 'No projects yet'}
            message={
              query
                ? `Nothing matches "${query}". Try a different search.`
                : 'Create your first project to start tracking delivery.'
            }
            actionLabel={query ? undefined : 'New project'}
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p, i) => {
              const client = clientById(p.clientId)
              const util = budgetUtil(p.spent, p.budget)
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.04 * i, 0.3), duration: 0.25 }}
                  className="group rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-[1px] hover:border-line-strong hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-fg group-hover:text-white">
                        {p.name}
                      </h3>
                      {client && (
                        <button
                          onClick={() => navigate({ view: 'client', id: client.id })}
                          className="mt-1 flex items-center gap-1.5 text-[12.5px] text-fg-3 transition-colors duration-150 hover:text-gold"
                        >
                          <Avatar initials={client.initials} size={16} />
                          {client.company}
                        </button>
                      )}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[12px] text-fg-3">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={12} />
                      {p.progress}% complete
                    </span>
                    <span className="flex items-center gap-1 tabular">
                      <CalendarDays size={12} />
                      {formatDate(p.deadline)}
                    </span>
                  </div>
                  <ProgressBar
                    value={p.progress}
                    className="mt-2"
                    tone={p.status === 'Behind' ? 'danger' : p.status === 'Completed' ? 'emerald' : 'gold'}
                  />

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12.5px]">
                    <span className="tabular text-fg-2">
                      <span className="text-fg font-medium">{fmt(p.spent)}</span>
                      <span className="text-fg-3"> / {fmt(p.budget)}</span>
                    </span>
                    <span className={cn('tabular', util > 90 ? 'text-gold' : 'text-fg-3')}>
                      {util}% used
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AddProjectModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

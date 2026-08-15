'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus, Search, FolderKanban, CalendarDays, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationBar } from '@/components/ui/Pagination'
import { AddProjectModal } from '@/components/modals/AddProjectModal'
import { api, queryString } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { fmt, formatDate, initialsOf } from '@/lib/utils'
import { projectStatusLabel } from '@/lib/labels'
import type { Project, ProjectStatus } from '@/lib/types'

const filters: (ProjectStatus | 'All')[] = ['All', 'ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']

const PER_PAGE = 50

export function ProjectsView({
  initialProjects,
  initialTotal,
}: {
  initialProjects: Project[]
  initialTotal: number
}) {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState<ProjectStatus | 'All'>('All')
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(Math.max(1, Math.ceil(initialTotal / PER_PAGE)))
  const [loading, setLoading] = useState(false)
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
    api
      .get<{ projects: Project[]; pagination: { pages: number } }>(
        `/api/projects${queryString({
          q: debouncedQuery,
          status: filter === 'All' ? undefined : filter,
          page,
          per_page: PER_PAGE,
        })}`,
        { signal: controller.signal },
      )
      .then((data) => {
        setProjects(data.projects)
        setPages(Math.max(1, data.pagination.pages))
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setProjects([])
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [debouncedQuery, filter, page])

  const onCreated = useCallback(
    (project: Project) => {
      setAddOpen(false)
      toast({ kind: 'success', title: 'Project created', message: `"${project.name}" is now in your pipeline.` })
      setProjects((prev) => [project, ...prev])
    },
    [toast],
  )

  const budgetUtil = (spent: number | string, budget: number | string) => {
    const b = Number(budget)
    return b > 0 ? Math.min(100, Math.round((Number(spent) / b) * 100)) : 0
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.client?.company.toLowerCase().includes(q) ?? false),
    )
  }, [projects, query])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">Projects</h1>
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
              {f === 'All' ? 'All' : projectStatusLabel[f]}
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
            title={debouncedQuery || filter !== 'All' ? 'No projects found' : 'No projects yet'}
            message={
              debouncedQuery || filter !== 'All'
                ? 'Nothing matches your filters. Try a different search.'
                : 'Create your first project to start tracking delivery.'
            }
            actionLabel={!debouncedQuery && filter === 'All' ? 'New project' : undefined}
            onAction={!debouncedQuery && filter === 'All' ? () => setAddOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p, i) => {
              const client = p.client
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
                        <Link
                          href={`/clients/${client.id}`}
                          className="mt-1 flex w-fit items-center gap-1.5 text-[12.5px] text-fg-3 transition-colors duration-150 hover:text-gold"
                        >
                          <Avatar initials={initialsOf(client.company)} size={16} />
                          {client.company}
                        </Link>
                      )}
                    </div>
                    <StatusBadge status={projectStatusLabel[p.status]} />
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
                    tone={p.status === 'BEHIND' ? 'danger' : p.status === 'COMPLETED' ? 'emerald' : 'gold'}
                  />

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12.5px]">
                    <span className="tabular text-fg-2">
                      <span className="text-fg font-medium">{fmt(Number(p.spent))}</span>
                      <span className="text-fg-3"> / {fmt(Number(p.budget))}</span>
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

      <PaginationBar
        page={page}
        pages={pages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pages, p + 1))}
        disabled={loading}
      />

      <AddProjectModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={onCreated} />
    </div>
  )
}

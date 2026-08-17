'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus, Search, FolderKanban, CalendarDays, TrendingUp, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationBar } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dropdown } from '@/components/ui/Dropdown'
import { Modal } from '@/components/ui/Modal'
import { AddProjectModal } from '@/components/modals/AddProjectModal'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { fmt, formatDate, initialsOf } from '@/lib/utils'
import { projectStatusLabel } from '@/lib/labels'
import type { Project, ProjectStatus } from '@/lib/types'

const filters: (ProjectStatus | 'All')[] = ['All', 'ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']

const PER_PAGE = 20

export function ProjectsView({ initialProjects }: { initialProjects: Project[] }) {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ProjectStatus | 'All'>('All')
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    let list = projects
    if (filter !== 'All') {
      list = list.filter((p) => p.status === filter)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.client?.company.toLowerCase().includes(q) ?? false),
      )
    }
    return list
  }, [projects, filter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const onCreated = useCallback(
    (project: Project) => {
      setAddOpen(false)
      setProjects((prev) => [project, ...prev])
    },
    [],
  )

  const onUpdated = useCallback(
    (updated: Project) => {
      setEditProject(null)
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    },
    [],
  )

  const doDelete = useCallback(async () => {
    if (!deleteProject) return
    setDeleting(true)
    try {
      await api.del(`/api/projects/${deleteProject.id}`)
      setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id))
      setDeleteProject(null)
      toast({ kind: 'success', title: 'Project deleted', message: `"${deleteProject.name}" has been removed.` })
    } catch {
      toast({ kind: 'warning', title: 'Could not delete project', message: 'Please try again.' })
    } finally {
      setDeleting(false)
    }
  }, [deleteProject, toast])

  const budgetUtil = (spent: number | string, budget: number | string) => {
    const b = Number(budget)
    return b > 0 ? Math.min(100, Math.round((Number(spent) / b) * 100)) : 0
  }

  return (
    <div>
      <PageHeader
        eyebrow="Engagements"
        title="Projects"
        subtitle="Track progress, budgets, and delivery across every engagement."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={15} strokeWidth={2.2} />
            New project
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1 sm:max-w-[280px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search projects…"
            className="h-9.5 w-full rounded-[var(--radius-input)] border border-line bg-surface pl-9 pr-3 text-[13.5px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-violet/50 focus:shadow-[var(--shadow-focus)]"
          />
        </div>
        <div className="flex flex-wrap rounded-[8px] border border-line bg-surface-2 p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f)
                setPage(1)
              }}
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
        {paged.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={query || filter !== 'All' ? 'No projects found' : 'No projects yet'}
            message={
              query || filter !== 'All'
                ? 'Nothing matches your filters. Try a different search.'
                : 'Create your first project to start tracking delivery.'
            }
            actionLabel={!query && filter === 'All' ? 'New project' : undefined}
            onAction={!query && filter === 'All' ? () => setAddOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paged.map((p, i) => {
              const client = p.client
              const util = budgetUtil(p.spent, p.budget)
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.04 * i, 0.3), duration: 0.3 }}
                  className="glass panel-hairline group rounded-[var(--radius-card)] p-5 transition-all duration-[220ms] ease-out hover:-translate-y-[2px] hover:border-line-strong hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-fg group-hover:text-white">
                        {p.name}
                      </h3>
                      {client && (
                        <Link
                          href={`/clients/${client.id}`}
                          className="group/client mt-1 flex w-fit items-center gap-1.5 text-[12.5px] text-fg-3 transition-colors duration-[220ms] ease-out hover:text-violet"
                        >
                          <Avatar initials={initialsOf(client.company)} size={16} />
                          {client.company}
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={projectStatusLabel[p.status]} />
                      <Dropdown
                        trigger={
                          <button
                            className="rounded-md p-1 text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        }
                        width={180}
                        align="right"
                      >
                        {(close) => (
                          <div className="p-1.5">
                            <button
                              onClick={() => {
                                close()
                                setEditProject(p)
                              }}
                              className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg transition-colors duration-150 hover:bg-hover"
                            >
                              <Pencil size={15} />
                              Edit project
                            </button>
                            <button
                              onClick={() => {
                                close()
                                setDeleteProject(p)
                              }}
                              className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-danger transition-colors duration-150 hover:bg-danger/10"
                            >
                              <Trash2 size={15} />
                              Delete project
                            </button>
                          </div>
                        )}
                      </Dropdown>
                    </div>
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
                    <span className={cn('tabular', util > 90 ? 'text-violet' : 'text-fg-3')}>
                      {util}% used
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <PaginationBar
          page={safePage}
          pages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}

      <AddProjectModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={onCreated} />

      <AddProjectModal
        open={!!editProject}
        onClose={() => setEditProject(null)}
        project={editProject ?? undefined}
        onUpdated={onUpdated}
      />

      <Modal
        open={!!deleteProject}
        onClose={() => {
          if (!deleting) setDeleteProject(null)
        }}
        title="Delete project"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setDeleteProject(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={() => void doDelete()} loading={deleting}>
              {deleting ? 'Deleting…' : 'Delete project'}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-fg-2">
          Are you sure you want to delete &quot;{deleteProject?.name}&quot;? This action cannot be undone and all associated data will be permanently removed.
        </p>
      </Modal>
    </div>
  )
}

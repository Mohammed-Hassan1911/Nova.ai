'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Users, FolderKanban, CheckSquare, FileText, ArrowRight } from 'lucide-react'
import { api } from '@/lib/client'
import { EASE_OUT } from '@/components/motion/variants'
import type { Client, Project, Task, Invoice } from '@/lib/types'

interface SearchResult {
  id: string
  type: 'client' | 'project' | 'task' | 'invoice'
  title: string
  subtitle: string
  href: string
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  client: { icon: <Users size={13} />, color: 'bg-emerald/15 text-emerald', label: 'Client' },
  project: { icon: <FolderKanban size={13} />, color: 'bg-info/15 text-info', label: 'Project' },
  task: { icon: <CheckSquare size={13} />, color: 'bg-white/8 text-fg-2', label: 'Task' },
  invoice: { icon: <FileText size={13} />, color: 'bg-violet/15 text-violet-bright', label: 'Invoice' },
}

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIdx(0)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    const timeout = setTimeout(async () => {
      try {
        const q = query.trim()
        const [clientsRes, projectsRes, tasksRes, invoicesRes] = await Promise.all([
          api.get<{ clients: Client[] }>(`/api/clients?q=${encodeURIComponent(q)}&per_page=5`),
          api.get<{ projects: Project[] }>(`/api/projects?q=${encodeURIComponent(q)}&per_page=5`),
          api.get<{ tasks: Task[] }>(`/api/tasks?q=${encodeURIComponent(q)}&per_page=5`),
          api.get<{ invoices: Invoice[] }>(`/api/invoices?q=${encodeURIComponent(q)}&per_page=5`),
        ])

        const items: SearchResult[] = []

        for (const c of clientsRes.clients ?? []) {
          items.push({
            id: c.id,
            type: 'client',
            title: c.company || c.name,
            subtitle: [c.name, c.email].filter(Boolean).join(' · '),
            href: `/clients/${c.id}`,
          })
        }
        for (const p of projectsRes.projects ?? []) {
          items.push({
            id: p.id,
            type: 'project',
            title: p.name,
            subtitle: p.client?.company ?? 'No client',
            href: `/projects`,
          })
        }
        for (const t of tasksRes.tasks ?? []) {
          items.push({
            id: t.id,
            type: 'task',
            title: t.title,
            subtitle: t.project?.name ?? 'No project',
            href: `/tasks`,
          })
        }
        for (const i of invoicesRes.invoices ?? []) {
          items.push({
            id: i.id,
            type: 'invoice',
            title: i.number,
            subtitle: i.client?.company ?? i.status,
            href: `/invoices/${i.id}`,
          })
        }

        setResults(items)
        setSelectedIdx(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  const navigate = useCallback(
    (href: string) => {
      onClose()
      router.push(href)
    },
    [onClose, router],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      navigate(results[selectedIdx].href)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="fixed left-1/2 top-[15vh] z-[101] w-full max-w-[540px] -translate-x-1/2"
          >
            <div className="glass-panel overflow-hidden rounded-[18px]">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <Search size={16} className="shrink-0 text-fg-3" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search clients, projects, tasks, invoices…"
                  className="flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-3/60"
                />
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-fg-3 transition-colors hover:bg-hover hover:text-fg-2"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {query.trim() && loading && (
                  <p className="px-4 py-8 text-center text-[13px] text-fg-3">Searching…</p>
                )}

                {!loading && query.trim() && results.length === 0 && (
                  <p className="px-4 py-8 text-center text-[13px] text-fg-3">
                    No results found for &ldquo;{query}&rdquo;
                  </p>
                )}

                {!query.trim() && (
                  <p className="px-4 py-8 text-center text-[13px] text-fg-3">
                    Type to search across your workspace.
                  </p>
                )}

                {results.map((r, i) => {
                  const cfg = typeConfig[r.type]
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => navigate(r.href)}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                        i === selectedIdx ? 'bg-hover' : ''
                      }`}
                    >
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-[8px] ${cfg.color}`}
                      >
                        {cfg.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-fg">
                          {r.title}
                        </span>
                        <span className="block truncate text-[12px] text-fg-3">
                          {cfg.label} · {r.subtitle}
                        </span>
                      </span>
                      <ArrowRight size={13} className="shrink-0 text-fg-3" />
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

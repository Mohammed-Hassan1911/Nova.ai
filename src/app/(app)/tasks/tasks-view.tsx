'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Check, ChevronRight, CalendarCheck2, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddTaskModal } from '@/components/modals/AddTaskModal'
import { api, queryString } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { taskPriorityLabel } from '@/lib/labels'
import type { Task, TaskPriority } from '@/lib/types'

const priorityDot: Record<TaskPriority, string> = {
  HIGH: 'bg-danger',
  MEDIUM: 'bg-gold',
  LOW: 'bg-emerald',
}

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Group {
  title: string
  subtitle: string
  tasks: Task[]
  tone?: 'danger'
  done?: boolean
}

export function TasksView({
  initialTasks,
  initialCompletedTotal,
}: {
  initialTasks: Task[]
  initialCompletedTotal: number
}) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [completedTotal, setCompletedTotal] = useState(initialCompletedTotal)
  const [loadingMore, setLoadingMore] = useState(false)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const today = todayKey()
    const matches = (t: Task) =>
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.project?.name.toLowerCase().includes(q) ?? false)

    const open = tasks.filter((t) => t.status !== 'COMPLETED' && matches(t))
    const completed = tasks.filter((t) => t.status === 'COMPLETED' && matches(t))

    const list: Group[] = [
      {
        title: 'Due today',
        subtitle: today,
        tasks: open.filter((t) => t.dueDate && t.dueDate.slice(0, 10) === today),
        tone: 'danger',
      },
      {
        title: 'Upcoming',
        subtitle: 'After today',
        tasks: open.filter((t) => !t.dueDate || t.dueDate.slice(0, 10) > today),
      },
    ]
    const overdue = open.filter((t) => t.dueDate && t.dueDate.slice(0, 10) < today)
    if (overdue.length > 0) {
      list.push({ title: 'Overdue', subtitle: 'Missed dates', tasks: overdue, tone: 'danger' })
    }
    list.push({ title: 'Completed', subtitle: `${completed.length} tasks`, tasks: completed, done: true })
    return list
  }, [tasks, query])

  const openCount = useMemo(() => tasks.filter((t) => t.status !== 'COMPLETED').length, [tasks])

  const toggle = useCallback(
    async (t: Task) => {
      const next = t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
      setTogglingId(t.id)
      try {
        const data = await api.patch<{ task: Task }>(`/api/tasks/${t.id}`, { status: next })
        setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...data.task } : x)))
        setCompletedTotal((c) => c + (next === 'COMPLETED' ? 1 : -1))
      } catch (err) {
        toast({
          kind: 'warning',
          title: 'Could not update task',
          message: err instanceof Error && err.message ? err.message : 'Please try again.',
        })
      } finally {
        setTogglingId(null)
      }
    },
    [toast],
  )

  const loadMoreCompleted = useCallback(async () => {
    const loaded = tasks.filter((t) => t.status === 'COMPLETED').length
    const nextPage = Math.floor(loaded / 50) + 1
    setLoadingMore(true)
    try {
      const data = await api.get<{ tasks: Task[]; pagination: { total: number; pages: number } }>(
        `/api/tasks${queryString({
          status: 'COMPLETED',
          page: nextPage,
          per_page: 50,
        })}`,
      )
      setTasks((prev) => {
        const known = new Set(prev.map((t) => t.id))
        return [...prev, ...data.tasks.filter((t) => !known.has(t.id))]
      })
      setCompletedTotal(data.pagination.total)
    } catch (err) {
      toast({
        kind: 'warning',
        title: 'Could not load tasks',
        message: err instanceof Error && err.message ? err.message : 'Please try again.',
      })
    } finally {
      setLoadingMore(false)
    }
  }, [tasks, toast])

  const onCreated = useCallback((task: Task) => {
    setAddOpen(false)
    toast({ kind: 'success', title: 'Task created', message: `"${task.title}" added to your queue.` })
    setTasks((prev) => [task, ...prev])
  }, [toast])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">Tasks</h1>
          <p className="mt-1 text-[13.5px] text-fg-3">
            {openCount} open · {completedTotal} completed
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} strokeWidth={2.2} />
          New task
        </Button>
      </div>

      <div className="relative mt-6 max-w-xs">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks…"
          className="h-9.5 w-full rounded-[var(--radius-input)] border border-line bg-surface pl-9 pr-3 text-[13.5px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
        />
      </div>

      <div className="mt-6">
        {tasks.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="No tasks yet"
            message="Add a task to start tracking your day."
            actionLabel="New task"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          groups.map((g) => (
            <TaskGroup
              key={g.title}
              group={g}
              togglingId={togglingId}
              onToggle={toggle}
            />
          ))
        )}
        {completedTotal > tasks.filter((t) => t.status === 'COMPLETED').length && !query.trim() && (
          <div className="mt-2 flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadMoreCompleted()}
              loading={loadingMore}
              icon={<ChevronRight size={14} />}
            >
              Load more completed
            </Button>
          </div>
        )}
      </div>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={onCreated} />
    </div>
  )
}

function TaskGroup({
  group,
  togglingId,
  onToggle,
}: {
  group: Group
  togglingId: string | null
  onToggle: (t: Task) => void
}) {
  const { title, subtitle, tasks, tone, done } = group
  if (tasks.length === 0) return null

  return (
    <div className="mb-7">
      <div className="mb-2.5 flex items-baseline gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fg-3">{title}</h2>
        <span className={cn('text-[11.5px]', tone === 'danger' ? 'text-danger' : 'text-fg-3')}>{subtitle}</span>
      </div>
      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
        {tasks.map((t, i) => {
          const busy = togglingId === t.id
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.03 * i, 0.2), duration: 0.2 }}
            >
              <button
                onClick={() => onToggle(t)}
                disabled={busy}
                className="group flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-hover disabled:opacity-70"
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-all duration-150',
                    done
                      ? 'border-gold/40 bg-gold/15 text-gold'
                      : 'border-line-strong text-transparent group-hover:border-gold/40 group-hover:text-gold/50',
                  )}
                >
                  {busy ? (
                    <Loader2 size={11} className="animate-spin text-gold" />
                  ) : done ? (
                    <Check size={12} strokeWidth={3} />
                  ) : (
                    <Circle size={9} className="opacity-40" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-[13.5px] transition-colors duration-150',
                      done ? 'text-fg-3 line-through' : 'text-fg group-hover:text-white',
                    )}
                  >
                    {t.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-fg-3">
                    <span className={cn('h-1.5 w-1.5 rounded-full', priorityDot[t.priority])} />
                    <span className="capitalize">{taskPriorityLabel[t.priority].toLowerCase()}</span>
                    {t.project && (
                      <>
                        <span>·</span>
                        <span>{t.project.name}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>Due {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="shrink-0 text-fg-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

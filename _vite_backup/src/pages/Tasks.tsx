import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Check, ChevronRight, CalendarCheck2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { AddTaskModal } from '@/components/modals/AddTaskModal'
import { useAppState } from '@/store/AppState'
import type { Task, TaskPriority, Project } from '@/data/mock'

const day = 24 * 60 * 60 * 1000
const iso = (offset: number) => new Date(Date.now() + offset * day).toISOString().slice(0, 10)

const priorityDot: Record<TaskPriority, string> = {
  High: 'bg-danger',
  Medium: 'bg-gold',
  Low: 'bg-emerald',
}

export function Tasks() {
  const { tasks, toggleTask, projectById, navigate } = useAppState()
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 450)
    return () => window.clearTimeout(t)
  }, [])

  const today = iso(0)
  const tomorrow = iso(1)

  const { open, completed } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const openList = tasks.filter(
      (t) =>
        !t.done &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          (t.projectId ? projectById(t.projectId)?.name.toLowerCase().includes(q) ?? false : false)),
    )
    const doneList = q ? tasks.filter((t) => t.done && t.title.toLowerCase().includes(q)) : tasks.filter((t) => t.done)
    return {
      open: {
        today: openList.filter((t) => t.due === today),
        upcoming: openList.filter((t) => t.due > today),
        later: openList.filter((t) => t.due < today),
      },
      completed: doneList,
    }
  }, [tasks, query, projectById])

  const openCount = open.today.length + open.upcoming.length + open.later.length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">
            Tasks
          </h1>
          <p className="mt-1 text-[13.5px] text-fg-3">
            {openCount} open · {completed.length} completed
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
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <Skeleton className="h-5 w-5 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-56" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="No tasks yet"
            message="Add a task to start tracking your day."
            actionLabel="New task"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <>
            <TaskGroup
              title="Due today"
              subtitle={today}
              tasks={open.today}
              tone="danger"
              toggleTask={toggleTask}
              projectById={projectById}
              navigate={navigate}
            />
            <TaskGroup
              title="Upcoming"
              subtitle={`After ${tomorrow}`}
              tasks={open.upcoming}
              toggleTask={toggleTask}
              projectById={projectById}
              navigate={navigate}
            />
            {open.later.length > 0 && (
              <TaskGroup
                title="Overdue"
                subtitle="Missed dates"
                tasks={open.later}
                tone="danger"
                toggleTask={toggleTask}
                projectById={projectById}
                navigate={navigate}
              />
            )}
            <TaskGroup
              title="Completed"
              subtitle={`${completed.length} tasks`}
              tasks={completed}
              done
              toggleTask={toggleTask}
              projectById={projectById}
              navigate={navigate}
            />
          </>
        )}
      </div>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function TaskGroup({
  title,
  subtitle,
  tasks,
  tone,
  done,
  toggleTask,
  projectById,
  navigate,
}: {
  title: string
  subtitle: string
  tasks: Task[]
  tone?: 'danger'
  done?: boolean
  toggleTask: (id: string) => void
  projectById: (id: string) => Project | undefined
  navigate: ReturnType<typeof useAppState>['navigate']
}) {
  if (tasks.length === 0) return null

  return (
    <div className="mb-7">
      <div className="mb-2.5 flex items-baseline gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fg-3">
          {title}
        </h2>
        <span
          className={cn(
            'text-[11.5px]',
            tone === 'danger' ? 'text-danger' : 'text-fg-3',
          )}
        >
          {subtitle}
        </span>
      </div>
      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
        {tasks.map((t, i) => {
          const project = t.projectId ? projectById(t.projectId) : null
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.03 * i, 0.2), duration: 0.2 }}
            >
              <button
                onClick={() => toggleTask(t.id)}
                className={cn(
                  'group flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-hover',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-all duration-150',
                    done
                      ? 'border-gold/40 bg-gold/15 text-gold'
                      : 'border-line-strong text-transparent group-hover:border-gold/40 group-hover:text-gold/50',
                  )}
                >
                  {done && <Check size={12} strokeWidth={3} />}
                  {!done && <Circle size={9} className="opacity-40" />}
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
                    {project ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate({ view: 'projects' })
                          }}
                          className="transition-colors duration-150 hover:text-gold"
                        >
                          {project.name}
                        </button>
                        <span>·</span>
                      </>
                    ) : null}
                    <span>Due {t.due}</span>
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

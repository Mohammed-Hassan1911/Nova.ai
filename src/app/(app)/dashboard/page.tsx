'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  CircleDollarSign,
  Wallet,
  FolderKanban,
  CheckSquare,
  ArrowRight,
  FilePlus2,
  CheckCircle2,
  UserPlus,
  Briefcase,
  Sparkles,
  TrendingUp,
  CalendarClock,
  CircleDot,
} from 'lucide-react'
import { cn, fmt, greeting, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { EASE_OUT } from '@/components/motion/variants'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { RevenueChart, type ChartPoint } from '@/components/RevenueChart'
import { api } from '@/lib/client'
import type { DashboardData, ActivityItem, Project, Task } from '@/lib/types'

const monthLabel = (month: string) => {
  const [y, m] = month.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short' })
}

const activityIcon: Record<string, React.ReactNode> = {
  INVOICE_PAID: <CheckCircle2 size={13} />,
  PAYMENT_RECEIVED: <CheckCircle2 size={13} />,
  INVOICE_CREATED: <FilePlus2 size={13} />,
  INVOICE_SENT: <FilePlus2 size={13} />,
  INVOICE_OVERDUE: <FilePlus2 size={13} />,
  INVOICE_UPDATED: <FilePlus2 size={13} />,
  PROJECT_CREATED: <Briefcase size={13} />,
  PROJECT_UPDATED: <Briefcase size={13} />,
  PROJECT_COMPLETED: <Briefcase size={13} />,
  TASK_CREATED: <CheckCircle2 size={13} />,
  TASK_COMPLETED: <CheckCircle2 size={13} />,
  CLIENT_CREATED: <UserPlus size={13} />,
  CLIENT_UPDATED: <UserPlus size={13} />,
  AI_ACTION: <Sparkles size={13} />,
}

const activityCls: Record<string, string> = {
  INVOICE_PAID: 'bg-emerald/12 text-emerald',
  PAYMENT_RECEIVED: 'bg-emerald/12 text-emerald',
  INVOICE_CREATED: 'bg-violet/12 text-violet',
  INVOICE_SENT: 'bg-violet/12 text-violet',
  INVOICE_OVERDUE: 'bg-danger/12 text-danger',
  INVOICE_UPDATED: 'bg-violet/12 text-violet',
  PROJECT_CREATED: 'bg-info/12 text-info',
  PROJECT_UPDATED: 'bg-info/12 text-info',
  PROJECT_COMPLETED: 'bg-info/12 text-info',
  TASK_CREATED: 'bg-white/[0.06] text-fg-2',
  TASK_COMPLETED: 'bg-white/[0.06] text-fg-2',
  CLIENT_CREATED: 'bg-emerald/12 text-emerald',
  CLIENT_UPDATED: 'bg-emerald/12 text-emerald',
  AI_ACTION: 'bg-violet/12 text-violet',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    api
      .get<DashboardData>('/api/dashboard')
      .then(setData)
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    Promise.all([
      api.get<{ projects: Project[] }>('/api/projects?per_page=8'),
      api.get<{ tasks: Task[] }>('/api/tasks?per_page=8&status=OPEN'),
    ])
      .then(([p, t]) => {
        setProjects(
          (p.projects ?? []).filter((x) => x.status !== 'COMPLETED').slice(0, 4),
        )
        setTasks(
          (t.tasks ?? [])
            .filter((x) => x.dueDate)
            .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
            .slice(0, 5),
        )
      })
      .catch(() => {})
  }, [])

  const points: ChartPoint[] =
    data?.revenueByMonth.map((p) => ({ label: monthLabel(p.month), value: p.total })) ?? []

  const avg = points.length ? points.reduce((s, p) => s + p.value, 0) / points.length : 0
  const best = points.length
    ? points.reduce((a, b) => (b.value > a.value ? b : a))
    : null

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.05 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <span className="eyebrow text-violet-bright">Command center</span>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.025em] text-fg lg:text-[36px]">
            {greeting()}.
          </h1>
          <p className="mt-1.5 text-[14px] text-fg-3">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="hidden items-center gap-2.5 sm:flex">
          <Link href="/invoices/new">
            <Button variant="secondary" size="sm">
              <FilePlus2 size={14} />
              New invoice
            </Button>
          </Link>
          <Link href="/assistant">
            <Button size="sm">
              <Sparkles size={13} />
              Ask VANTA AI
            </Button>
          </Link>
        </div>
      </motion.div>

      <AIInsightBar data={data} error={error} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-4 h-8 w-28" />
              <Skeleton className="mt-3 h-3 w-32" />
            </div>
          ))
        ) : (
          <Stagger delayChildren={0.08} stagger={0.07} className="contents">
            <StaggerItem>
              <StatTile
                label="Revenue received"
                value={data.metrics.revenue.received}
                format={fmt}
                delta="12-month total"
                sub="money collected"
                icon={<CircleDollarSign size={17} />}
                tone="emerald"
              />
            </StaggerItem>
            <StaggerItem>
              <StatTile
                label="Outstanding"
                value={data.metrics.revenue.outstanding}
                format={fmt}
                delta={`${fmt(data.metrics.revenue.overdue)} overdue`}
                sub="awaiting payment"
                icon={<Wallet size={17} />}
                tone="gold"
              />
            </StaggerItem>
            <StaggerItem>
              <StatTile
                label="Active Projects"
                value={data.metrics.projects}
                sub="projects created"
                icon={<FolderKanban size={17} />}
                tone="info"
              />
            </StaggerItem>
            <StaggerItem>
              <StatTile
                label="Tasks"
                value={data.metrics.tasks.open}
                delta={`${data.metrics.tasks.completed} completed`}
                sub="open right now"
                icon={<CheckSquare size={17} />}
                tone="gold"
              />
            </StaggerItem>
          </Stagger>
        )}
      </div>

      {error && (
        <p className="mt-6 text-[13px] text-danger">
          Could not load your dashboard. Please try again.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.18 }}
        >
          <div className="glass panel-hairline rounded-[var(--radius-panel)] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="eyebrow text-violet">Revenue</span>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="text-[30px] font-semibold tabular tracking-[-0.02em] text-fg lg:text-[34px]">
                  <AnimatedNumber value={data?.metrics.revenue.received ?? 0} format={fmt} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-violet/25 bg-violet/[0.08] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-violet">
                  <TrendingUp size={11} />
                  12 mo
                </span>
              </div>
              <p className="mt-1 text-[12.5px] text-fg-3">
                money received over the last 12 months
              </p>
            </div>
          </div>
          <div className="mt-6">
            {points.length > 0 ? (
              <RevenueChart points={points} />
            ) : (
              <div className="flex h-[280px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-line bg-surface-2/40 text-[13px] text-fg-3">
                No revenue recorded yet.
              </div>
            )}
          </div>
          {points.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
              <div>
                <p className="eyebrow">Monthly average</p>
                <p className="mt-1 text-[16px] font-semibold tabular text-fg">{fmt(avg)}</p>
              </div>
              <div className="text-right">
                <p className="eyebrow">Best month</p>
                <p className="mt-1 text-[16px] font-semibold tabular text-fg">
                  {best?.label} <span className="text-violet">·</span> {fmt(best?.value ?? 0)}
                </p>
              </div>
            </div>
          )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.26 }}
        >
          <div className="glass panel-hairline rounded-[var(--radius-panel)] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="eyebrow text-violet">Activity</span>
              <h2 className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-fg">
                Recent activity
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-1 text-[12.5px] text-violet transition-colors duration-[220ms] ease-out hover:text-violet-bright"
            >
              View all
              <ArrowRight
                size={13}
                className="transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]"
              />
            </Link>
          </div>
          <ActivityTimeline items={data?.recentActivity ?? []} limit={7} />
          </div>
        </motion.div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.34 }}
        >
          <div className="glass panel-hairline rounded-[var(--radius-panel)] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="eyebrow text-violet">Momentum</span>
              <h2 className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-fg">
                Project progress
              </h2>
            </div>
            <Link
              href="/projects"
              className="group flex items-center gap-1 text-[12.5px] text-violet transition-colors duration-[220ms] ease-out hover:text-violet-bright"
            >
              View all
              <ArrowRight
                size={13}
                className="transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]"
              />
            </Link>
          </div>

          <Stagger stagger={0.07} delayChildren={0.05} className="mt-5 space-y-4">
            {projects.length === 0 ? (
              <p className="py-2 text-[13px] text-fg-3">
                No active projects yet. Create one to start tracking momentum.
              </p>
            ) : (
              projects.map((p) => (
                <StaggerItem key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="group block rounded-[12px] p-1 transition-colors duration-200 hover:bg-hover"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            'size-2 shrink-0 rounded-full',
                            p.status === 'ON_TRACK' && 'bg-emerald',
                            p.status === 'AT_RISK' && 'bg-violet',
                            p.status === 'BEHIND' && 'bg-danger',
                          )}
                        />
                        <span className="truncate text-[13.5px] font-medium text-fg">
                          {p.name}
                        </span>
                        {p.client?.company && (
                          <span className="hidden truncate text-[12px] text-fg-3 sm:block">
                            {p.client.company}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[12.5px] tabular font-medium text-fg-2">
                        {p.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: p.progress / 100 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                        className="h-full origin-left rounded-full bg-gradient-to-r from-violet/70 to-violet"
                      />
                    </div>
                  </Link>
                </StaggerItem>
              ))
            )}
          </Stagger>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.42 }}
        >
          <div className="glass panel-hairline rounded-[var(--radius-panel)] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="eyebrow text-violet">Up next</span>
              <h2 className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-fg">
                Upcoming deadlines
              </h2>
            </div>
            <Link
              href="/tasks"
              className="group flex items-center gap-1 text-[12.5px] text-violet transition-colors duration-[220ms] ease-out hover:text-violet-bright"
            >
              View all
              <ArrowRight
                size={13}
                className="transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]"
              />
            </Link>
          </div>

          <Stagger stagger={0.07} delayChildren={0.05} className="mt-5 space-y-3">
            {tasks.length === 0 ? (
              <p className="py-2 text-[13px] text-fg-3">
                No upcoming deadlines. Your schedule is clear.
              </p>
            ) : (
              tasks.map((t) => (
                <StaggerItem key={t.id}>
                  <Link
                    href="/tasks"
                    className="group flex items-center gap-3 rounded-[12px] p-1 transition-colors duration-200 hover:bg-hover"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-line bg-canvas/50 text-fg-2 transition-colors duration-[220ms] ease-out group-hover:border-violet/30 group-hover:text-violet">
                      {t.status === 'IN_PROGRESS' ? (
                        <CircleDot size={14} />
                      ) : (
                        <CalendarClock size={14} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-fg">
                        {t.title}
                      </span>
                      {t.project?.name && (
                        <span className="block truncate text-[12px] text-fg-3">
                          {t.project.name}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-[12px] tabular text-fg-3">
                      {new Date(t.dueDate!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </Link>
                </StaggerItem>
              ))
            )}
          </Stagger>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const toneChips = {
  emerald: 'bg-emerald/10 text-emerald border-emerald/20',
  gold: 'bg-violet/10 text-violet-bright border-violet/25',
  info: 'bg-cyan/10 text-cyan border-cyan/20',
} as const

const deltaChips = {
  emerald: 'border-emerald/20 bg-emerald/[0.06] text-emerald',
  gold: 'border-violet/25 bg-violet/[0.08] text-violet-bright',
  info: 'border-cyan/20 bg-cyan/[0.06] text-cyan',
} as const

function AIInsightBar({
  data,
  error,
}: {
  data: DashboardData | null
  error: boolean
}) {
  const [idx, setIdx] = useState(0)

  const insights = useInsights(data)

  useEffect(() => {
    if (insights.length <= 1) return
    const id = window.setInterval(() => setIdx((i) => (i + 1) % insights.length), 5200)
    return () => window.clearInterval(id)
  }, [insights.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 }}
      className="glass-strong panel-hairline-accent mt-7 flex items-center gap-4 overflow-hidden rounded-[var(--radius-panel)] px-5 py-4"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-b from-violet to-violet-deep text-white shadow-[0_8px_20px_-8px_rgba(139,92,246,0.7)]">
        <Sparkles size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-fg-3">
          AI insight
        </p>
        <div className="relative mt-0.5 min-h-[22px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={error ? 'err' : data ? idx : 'load'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="truncate text-[13.5px] text-fg-2"
            >
              {error
                ? 'Could not load your dashboard data. Please try again.'
                : !data
                  ? 'Analyzing your workspace…'
                  : insights[idx % Math.max(insights.length, 1)]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      <Link
        href="/assistant"
        className="group hidden shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-violet-bright transition-colors duration-[220ms] ease-out hover:text-violet sm:flex"
      >
        Ask VANTA AI
        <ArrowRight
          size={13}
          className="transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]"
        />
      </Link>
    </motion.div>
  )
}

function useInsights(data: DashboardData | null): string[] {
  if (!data) return []
  const out: string[] = []
  const m = data.metrics
  if (m.revenue.outstanding > 0) {
    out.push(
      `You have ${fmt(m.revenue.outstanding)} outstanding across invoices${
        m.revenue.overdue > 0 ? ` — ${fmt(m.revenue.overdue)} is overdue` : ''
      }.`,
    )
  }
  if (m.revenue.received > 0) {
    out.push(`You've collected ${fmt(m.revenue.received)} in revenue over the last 12 months.`)
  }
  out.push(`${m.projects} active projects and ${m.tasks.open} open tasks right now.`)
  if (m.tasks.completed > 0) {
    out.push(`${m.tasks.completed} tasks completed — momentum is building.`)
  }
  if (out.length === 0) out.push('Your workspace is clear. Add a client or project to get going.')
  return out
}

function StatTile({
  label,
  value,
  format,
  delta,
  sub,
  icon,
  tone,
}: {
  label: string
  value: number
  format?: (value: number) => string
  delta?: string
  sub?: string
  icon: React.ReactNode
  tone?: 'emerald' | 'gold' | 'info'
}) {
  const t = tone ?? 'gold'
  return (
    <div className="glass panel-hairline group relative rounded-[var(--radius-card)] p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-violet/30 hover:shadow-[var(--shadow-glow)] sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-violet/[0.05] to-transparent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-[13px] border transition-transform duration-300 ease-out group-hover:-rotate-3 group-hover:scale-110',
            toneChips[t],
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-[28px] font-semibold tabular tracking-[-0.02em] text-fg sm:text-[30px]">
        <AnimatedNumber value={value} format={format} />
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium',
              deltaChips[t],
            )}
          >
            <TrendingUp size={11} strokeWidth={2.2} />
            {delta}
          </span>
        )}
        {sub && <span className="text-fg-3">{sub}</span>}
      </div>
    </div>
  )
}

export function ActivityTimeline({ items, limit }: { items: ActivityItem[]; limit?: number }) {
  const list = items.slice(0, limit ?? items.length)

  if (list.length === 0) {
    return (
      <p className="mt-4 text-[13px] text-fg-3">
        No activity yet. Create a client or project to get started.
      </p>
    )
  }

  return (
    <ol className="mt-5 space-y-0">
      {list.map((a, i) => (
        <motion.li
          key={a.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04 * i, duration: 0.25 }}
          className="relative flex gap-3 pb-5 last:pb-0"
        >
          {i < list.length - 1 && (
            <span className="absolute left-[14px] top-8 h-[calc(100%-24px)] w-px bg-gradient-to-b from-line-strong to-line" />
          )}
          <span
            className={cn(
              'z-10 flex size-7 shrink-0 items-center justify-center rounded-[9px] border border-line',
              activityCls[a.kind] ?? 'bg-white/[0.06] text-fg-2',
            )}
          >
            {activityIcon[a.kind] ?? <ArrowUpRight size={13} />}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] leading-snug text-fg">{a.text}</p>
            {a.detail && <p className="mt-0.5 text-[12px] text-fg-3">{a.detail}</p>}
          </div>
          <span className="shrink-0 pt-0.5 text-[11px] tabular text-fg-3">
            {timeAgo(a.createdAt)}
          </span>
        </motion.li>
      ))}
    </ol>
  )
}

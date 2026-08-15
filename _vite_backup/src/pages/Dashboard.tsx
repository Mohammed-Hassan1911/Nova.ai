import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  Wallet,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  ArrowRight,
  Upload,
  FilePlus2,
  CheckCircle2,
  UserPlus,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { RevenueChart } from '@/components/RevenueChart'
import { useAppState } from '@/store/AppState'
import { useToast } from '@/components/ui/Toast'
import { fmt, greeting } from '@/lib/utils'
import {
  revenueSeries,
  revenueSummary,
  activity,
  clientById,
} from '@/data/mock'

type Range = '7D' | '30D' | '90D' | '1Y'

export function Dashboard() {
  const { user, invoices, projects, tasks, navigate, createInvoice } = useAppState()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('30D')

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(t)
  }, [])

  const metrics = useMemo(() => {
    const unpaid = invoices.filter((i) => i.status !== 'Paid')
    const outstanding = unpaid.reduce((s, i) => s + i.amount, 0)
    const active = projects.filter((p) => p.status !== 'Completed')
    const dueThisWeek = active.filter((p) => {
      const days = (new Date(p.deadline).getTime() - Date.now()) / 86400000
      return days >= 0 && days <= 7
    }).length
    return {
      revenue: 12840,
      revenueDelta: 18.4,
      outstanding,
      outstandingCount: unpaid.length,
      activeProjects: active.length,
      dueThisWeek,
      openTasks: tasks.filter((t) => !t.done).length,
      completedToday: tasks.filter((t) => t.done && t.completedToday).length,
    }
  }, [invoices, projects, tasks])

  const summary = revenueSummary[range]
  const growth = ((summary.current - summary.previous) / summary.previous) * 100

  const handleInvoiceQuickAction = () => {
    const client = clientById.get('c1')
    if (!client) return
    const id = createInvoice({
      clientId: 'c1',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      items: [{ description: 'Monthly retainer — Website Redesign', quantity: 1, rate: 1200 }],
    })
    toast({ kind: 'success', title: 'Invoice drafted', message: `${id} created for ${client.company}.` })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.022em] text-fg lg:text-[32px]">
            {greeting()}, {user.firstName}.
          </h1>
          <p className="mt-1 text-[14px] text-fg-3">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="hidden items-center gap-2.5 sm:flex">
          <Button variant="secondary" size="sm" onClick={handleInvoiceQuickAction}>
            <FilePlus2 size={14} />
            New invoice
          </Button>
          <Button size="sm" onClick={() => navigate({ view: 'assistant' })}>
            <SparklesMini />
            Ask NOVA AI
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-28" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))
        ) : (
          <>
            <MetricCard
              label="Revenue"
              value={fmt(metrics.revenue)}
              delta={`+${metrics.revenueDelta}%`}
              deltaUp
              sub="vs last month"
              icon={<CircleDollarSign size={16} />}
            />
            <MetricCard
              label="Outstanding"
              value={fmt(metrics.outstanding)}
              delta={`${metrics.outstandingCount} invoices`}
              deltaUp={false}
              neutral
              sub="awaiting payment"
              icon={<Wallet size={16} />}
            />
            <MetricCard
              label="Active Projects"
              value={String(metrics.activeProjects)}
              delta={`${metrics.dueThisWeek} due this week`}
              deltaUp={false}
              neutral
              sub="currently running"
              icon={<FolderKanban size={16} />}
            />
            <MetricCard
              label="Tasks"
              value={String(metrics.openTasks)}
              delta={`${metrics.completedToday} completed today`}
              deltaUp={false}
              neutral
              sub="open right now"
              icon={<CheckSquare size={16} />}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Revenue analytics */}
        <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-fg">Revenue</h2>
                <TrendingUp size={14} className="text-emerald" />
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-[26px] font-semibold tabular tracking-[-0.02em] text-fg">
                  {fmt(summary.current)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-emerald">
                  <ArrowUpRight size={13} />
                  {growth.toFixed(1)}%
                </span>
              </div>
              <p className="text-[12px] text-fg-3">
                vs {fmt(summary.previous)} previous period
              </p>
            </div>

            <div className="flex rounded-[8px] border border-line bg-surface-2 p-0.5">
              {(['7D', '30D', '90D', '1Y'] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    'rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors duration-150',
                    range === r ? 'bg-raised text-fg shadow-sm' : 'text-fg-3 hover:text-fg-2',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <RevenueChart key={range} points={revenueSeries[range]} />
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-fg">Recent activity</h2>
            <button
              onClick={() => navigate({ view: 'clients' })}
              className="flex items-center gap-1 text-[12.5px] text-gold transition-colors duration-150 hover:text-gold-bright"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          <ActivityTimeline limit={7} />
        </div>
      </div>
    </div>
  )
}

function SparklesMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5C8.9 4.2 9.8 5.8 12 7C9.8 8.2 8.9 9.8 8 12.5C7.1 9.8 6.2 8.2 4 7C6.2 5.8 7.1 4.2 8 1.5Z" fill="currentColor" />
    </svg>
  )
}

function MetricCard({
  label,
  value,
  delta,
  deltaUp,
  sub,
  icon,
  neutral,
}: {
  label: string
  value: string
  delta: string
  deltaUp?: boolean
  sub: string
  icon: React.ReactNode
  neutral?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-[1px] hover:border-line-strong hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-fg-3">{label}</span>
        <span className="flex size-7 items-center justify-center rounded-[7px] border border-line bg-surface-2 text-fg-3 transition-colors duration-200 group-hover:text-gold">
          {icon}
        </span>
      </div>
      <p className="mt-2.5 text-[24px] font-semibold tabular tracking-[-0.02em] text-fg">
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 text-[12px]">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 font-medium',
            deltaUp ? 'text-emerald' : neutral ? 'text-fg-2' : 'text-danger',
          )}
        >
          {deltaUp && <ArrowUpRight size={12} />}
          {!deltaUp && neutral && <ArrowDownRight size={12} />}
          {delta}
        </span>
        <span className="text-fg-3">· {sub}</span>
      </div>
    </motion.div>
  )
}

export function ActivityTimeline({ limit }: { limit?: number }) {
  const items = activity.slice(0, limit ?? activity.length)

  const icons: Record<string, React.ReactNode> = {
    payment: <Upload size={13} />,
    invoice: <FilePlus2 size={13} />,
    project: <Briefcase size={13} />,
    task: <CheckCircle2 size={13} />,
    client: <UserPlus size={13} />,
  }

  const iconCls: Record<string, string> = {
    payment: 'bg-emerald/12 text-emerald',
    invoice: 'bg-gold/12 text-gold',
    project: 'bg-info/12 text-info',
    task: 'bg-white/[0.06] text-fg-2',
    client: 'bg-emerald/12 text-emerald',
  }

  return (
    <ol className="mt-4 space-y-0">
      {items.map((a, i) => (
        <motion.li
          key={a.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04 * i, duration: 0.25 }}
          className="relative flex gap-3 pb-4 last:pb-0"
        >
          {i < items.length - 1 && (
            <span className="absolute left-[13px] top-8 h-[calc(100%-24px)] w-px bg-line" />
          )}
          <span
            className={cn(
              'z-10 flex size-[26px] shrink-0 items-center justify-center rounded-[7px] border border-line',
              iconCls[a.kind],
            )}
          >
            {icons[a.kind]}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] leading-snug text-fg">{a.text}</p>
            <p className="mt-0.5 text-[12px] text-fg-3">{a.detail}</p>
          </div>
          <span className="shrink-0 pt-0.5 text-[11px] tabular text-fg-3">
            {a.time}
          </span>
        </motion.li>
      ))}
    </ol>
  )
}

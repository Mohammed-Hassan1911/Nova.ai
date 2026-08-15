'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { cn, fmt, greeting, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { RevenueChart, type ChartPoint } from '@/components/RevenueChart'
import { api } from '@/lib/client'
import type { DashboardData, ActivityItem } from '@/lib/types'

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
  INVOICE_CREATED: 'bg-gold/12 text-gold',
  INVOICE_SENT: 'bg-gold/12 text-gold',
  INVOICE_OVERDUE: 'bg-danger/12 text-danger',
  INVOICE_UPDATED: 'bg-gold/12 text-gold',
  PROJECT_CREATED: 'bg-info/12 text-info',
  PROJECT_UPDATED: 'bg-info/12 text-info',
  PROJECT_COMPLETED: 'bg-info/12 text-info',
  TASK_CREATED: 'bg-white/[0.06] text-fg-2',
  TASK_COMPLETED: 'bg-white/[0.06] text-fg-2',
  CLIENT_CREATED: 'bg-emerald/12 text-emerald',
  CLIENT_UPDATED: 'bg-emerald/12 text-emerald',
  AI_ACTION: 'bg-gold/12 text-gold',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api
      .get<DashboardData>('/api/dashboard')
      .then(setData)
      .catch(() => setError(true))
  }, [])

  const points: ChartPoint[] =
    data?.revenueByMonth.map((p) => ({ label: monthLabel(p.month), value: p.total })) ?? []

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.022em] text-fg lg:text-[32px]">
            {greeting()}.
          </h1>
          <p className="mt-1 text-[14px] text-fg-3">
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
              Ask NOVA AI
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {!data ? (
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
              label="Revenue received"
              value={fmt(data.metrics.revenue.received)}
              delta="12-month total"
              sub="money collected"
              icon={<CircleDollarSign size={16} />}
              tone="emerald"
            />
            <MetricCard
              label="Outstanding"
              value={fmt(data.metrics.revenue.outstanding)}
              delta={`${fmt(data.metrics.revenue.overdue)} overdue`}
              sub="awaiting payment"
              icon={<Wallet size={16} />}
              tone="gold"
            />
            <MetricCard
              label="Active Projects"
              value={String(data.metrics.projects)}
              delta="all time"
              sub="projects created"
              icon={<FolderKanban size={16} />}
              tone="info"
            />
            <MetricCard
              label="Tasks"
              value={String(data.metrics.tasks.open)}
              delta={`${data.metrics.tasks.completed} completed`}
              sub="open right now"
              icon={<CheckSquare size={16} />}
              tone="gold"
            />
          </>
        )}
      </div>

      {error && (
        <p className="mt-6 text-[13px] text-danger">
          Could not load your dashboard. Please try again.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-fg">Revenue</h2>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-[26px] font-semibold tabular tracking-[-0.02em] text-fg">
                  {fmt(data?.metrics.revenue.received ?? 0)}
                </span>
              </div>
              <p className="text-[12px] text-fg-3">money received over the last 12 months</p>
            </div>
          </div>
          <div className="mt-5">
            {points.length > 0 ? (
              <RevenueChart points={points} />
            ) : (
              <div className="flex h-[240px] items-center justify-center text-[13px] text-fg-3">
                No revenue recorded yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-fg">Recent activity</h2>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-[12.5px] text-gold transition-colors duration-150 hover:text-gold-bright"
            >
              Overview <ArrowRight size={13} />
            </Link>
          </div>
          <ActivityTimeline items={data?.recentActivity ?? []} limit={7} />
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  delta,
  sub,
  icon,
  tone,
}: {
  label: string
  value: string
  delta: string
  sub: string
  icon: React.ReactNode
  tone?: 'emerald' | 'gold' | 'info'
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
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-[7px] border border-line bg-surface-2 transition-colors duration-200 group-hover:text-gold',
            tone === 'emerald' && 'text-emerald',
            tone === 'gold' && 'text-gold',
            tone === 'info' && 'text-info',
            !tone && 'text-fg-3',
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2.5 text-[24px] font-semibold tabular tracking-[-0.02em] text-fg">{value}</p>
      <div className="mt-1.5 flex items-center gap-1.5 text-[12px]">
        <span className="inline-flex items-center gap-0.5 font-medium text-fg-2">
          {delta}
        </span>
        <span className="text-fg-3">· {sub}</span>
      </div>
    </motion.div>
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
    <ol className="mt-4 space-y-0">
      {list.map((a, i) => (
        <motion.li
          key={a.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04 * i, duration: 0.25 }}
          className="relative flex gap-3 pb-4 last:pb-0"
        >
          {i < list.length - 1 && (
            <span className="absolute left-[13px] top-8 h-[calc(100%-24px)] w-px bg-line" />
          )}
          <span
            className={cn(
              'z-10 flex size-[26px] shrink-0 items-center justify-center rounded-[7px] border border-line',
              activityCls[a.kind] ?? 'bg-white/[0.06] text-fg-2',
            )}
          >
            {activityIcon[a.kind] ?? <ArrowUpRight size={13} />}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] leading-snug text-fg">{a.text}</p>
            {a.detail && <p className="mt-0.5 text-[12px] text-fg-3">{a.detail}</p>}
          </div>
          <span className="shrink-0 pt-0.5 text-[11px] tabular text-fg-3">{timeAgo(a.createdAt)}</span>
        </motion.li>
      ))}
    </ol>
  )
}

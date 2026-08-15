import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  Active: 'border-emerald/25 bg-emerald/[0.08] text-emerald',
  Paid: 'border-emerald/25 bg-emerald/[0.08] text-emerald',
  'On track': 'border-emerald/25 bg-emerald/[0.08] text-emerald',
  Prospect: 'border-info/25 bg-info/[0.08] text-info',
  Pending: 'border-gold/30 bg-gold/[0.09] text-gold',
  Inactive: 'border-line-strong bg-white/[0.04] text-fg-3',
  Completed: 'border-line-strong bg-white/[0.04] text-fg-3',
  Overdue: 'border-danger/30 bg-danger/[0.09] text-danger',
  Behind: 'border-danger/30 bg-danger/[0.09] text-danger',
  'At risk': 'border-gold/30 bg-gold/[0.09] text-gold',
  Low: 'border-line-strong bg-white/[0.04] text-fg-2',
  Medium: 'border-info/25 bg-info/[0.08] text-info',
  High: 'border-gold/30 bg-gold/[0.09] text-gold',
}

const dotStyles: Record<string, string> = {
  Active: 'bg-emerald',
  Paid: 'bg-emerald',
  'On track': 'bg-emerald',
  Prospect: 'bg-info',
  Pending: 'bg-gold',
  Inactive: 'bg-fg-3',
  Completed: 'bg-fg-3',
  Overdue: 'bg-danger',
  Behind: 'bg-danger',
  'At risk': 'bg-gold',
  Low: 'bg-fg-3',
  Medium: 'bg-info',
  High: 'bg-gold',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap',
        statusStyles[status] ?? 'border-line-strong bg-white/[0.04] text-fg-2',
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          dotStyles[status] ?? 'bg-fg-3',
        )}
      />
      {status}
    </span>
  )
}

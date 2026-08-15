import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-panel)] border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
      <div className="dot-grid relative flex size-12 items-center justify-center rounded-[12px] border border-line bg-surface-2">
        <Icon size={19} className="text-fg-3" strokeWidth={1.7} />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-fg-3">
        {message}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
